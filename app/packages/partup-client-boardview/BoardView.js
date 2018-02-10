import { debounce, defer, each, get, throttle, findIndex } from 'lodash';
import Sortable from './Sortable';

const { debug } = Partup.client;
// debug.enable(true); // false by default;

Template.BoardView.onCreated(function() {
    const template = this;
    const partupId = this.data.partupId;

    this.loading = new ReactiveVar(true);
    this.dragging = new ReactiveVar(false);
    this.editLane = new ReactiveVar(undefined);
    this.addLane = new ReactiveVar(false);

    this.shouldUpdate = new Tracker.Dependency();
    this.waitingForUpdateResult = new ReactiveVar(false);
    this.board = {};
    this.lanes = [];

    let shouldResetSortableLanes;
    let sortableResetTimer;
    let initialLoad = true;

    // Autorun get's triggered many times. deboucing the update makes sure the UI only get's updated once.
    const updateChanges = debounce(() => {
      debug.log('updateChanges invoked');
      this.shouldUpdate.changed();

      if (shouldResetSortableLanes) {
        sortableResetTimer = setTimeout(() => {
          resetLanes();
          shouldResetSortableLanes = false;
        }, 50);
      }
    }, 100);

    this.autorun(() => {
      debug.log('autorun triggered');
      const dragging = this.dragging.get();
      const loading = this.loading.get();
      const waitingForUpdateResult = this.waitingForUpdateResult.get();
      if (dragging || loading || waitingForUpdateResult) {
        debug.log('discontinue autorun: ', { dragging, loading, waitingForUpdateResult });
        return;
      }
      debug.log('continue autorun: ', { dragging, loading, waitingForUpdateResult });

      const board = Boards.findOne({ partup_id: partupId });
      if (board) {
        this.board = board;

        const lanes = Lanes.find({ _id: { $in: board.lanes } })
          .map((lane) => {
            const order = [...lane.activities];
            const laneActivities = Activities.find({ _id: { $in: lane.activities }, deleted_at: { $ne: true } }).fetch();

            each(order, (o, i) => {
              const ui = findIndex(laneActivities, (a) => a._id === o);
              if (i !== ui) {
                const itemToMove = laneActivities.splice(ui, 1)[0];
                laneActivities.splice(i, 0, itemToMove);
              }
            });

            lane.activities = laneActivities;
            lane.activitiesCount = lane.activities.length;
            return lane;
          });

        debug.log('mapped lanes', {
          previous: template.lanes,
          new: lanes,
        });

        each(board.lanes, (bl, i) => {
          const ui = findIndex(lanes, (l) => l._id === bl);
          if (i !== ui) {
            const itemToMove = lanes.splice(ui, 1)[0];
            lanes.splice(i, 0, itemToMove);
          }
        });

        if (this.lanes.length !== lanes.length) {
          clearTimeout(sortableResetTimer);
          shouldResetSortableLanes = true;
        }

        this.lanes = lanes;

        // For the very first render we don't want to wait for the debounced update
        // this means that after 150ms it will get re-rendered but the user get's to see the content faster
        if (initialLoad) {
          this.shouldUpdate.changed();
          initialLoad = false;
        } else {
          updateChanges();
        }
      }
    });

    /**
     * Sortable
     */

    const laneSort = debounce(sortLaneHandle(template), 50);
    const setDragging = (val) => () => {
      debug.log('set dragging state: ', val);
      template.dragging.set(val);
    };

    this.sortableLaneHandlers = {
      onStart: setDragging(true),
      onEnd: setDragging(false),
      onSort: laneSort,
    };
    this.sortableLanes = [];

    const createSortableLanes = () => {
      if (User(Meteor.user()).isPartnerInPartup(this.data.partupId)) {
        this.$('[data-sortable-lane]')
          .each((index, laneEl) => {
            this.sortableLanes.push(createSortableLane(laneEl, this.sortableLaneHandlers));
          });
      }
    };

    const destroyLanes = () => {
      while (this.sortableLanes.length) {
        this.sortableLanes.shift().destroy();
      }
    };

    const resetLanes = () => {
      destroyLanes();
      createSortableLanes();
    };

    this.createSortable = () => {
      if (!this.boardEl) {
        return;
      }

      this.sortableBoard = createSortableBoard(this.boardEl, {
        onStart: setDragging(true),
        onEnd: setDragging(false),
        onUpdate({ oldIndex, newIndex }) {
          const boardId = get(template.board, '_id');
          if (boardId) {
            template.lanes.splice(newIndex, 0, template.lanes.splice(oldIndex, 1)[0]);
            const lanes = template.lanes.map(lane => lane._id);

            Meteor.call('boards.update', boardId, { lanes }, (error) => {
              if (error) {
                Partup.client.notify.error(error.message);
              }
            });
          }
        }
      });

      createSortableLanes();
    };

    this.destroySortable = () => {
      destroyLanes();
      if (this.sortableBoard) {
        this.sortableBoard.destroy();
      }
    };

    this.resetSortable = () => {
      this.destroySortable();
      this.createSortable();
    };

    // A timeout is used to wait with the autorun and sortable until the navigation is done to improve UX
    setTimeout(() => {
      this.loading.set(false);
    }, 0);
});

Template.BoardView.onRendered(function() {
  this.autorun((computation) => {
    if (!this.loading.get()) {
      Meteor.defer(() => {
        this.boardEl = this.find('[data-sortable-board]');
        // Only make the board sortable when the user is an upper, else do some magic to tell the user they can't drag
        if (User(Meteor.user()).isPartnerInPartup(this.data.partupId)) {
          this.createSortable();
        } else {
          let mouseAction = false;
          let isDragging = false;
          let recentlyNotified = false;
          let lastX;
          let lastY;
          const offset = 15;

          $(this.boardEl)
            .mousedown((event) => {
              mouseAction = true;
              lastX = event.screenX;
              lastY = event.screenY;
            })
            .mousemove(throttle((event) => {
              if (mouseAction) {
                if ((event.screenX > (lastX + offset) || (event.screenX < lastX - offset))
                  || (event.screenY > (lastY + offset) || event.screenY < lastY - offset)) {
                    isDragging = true;
                  } else {
                    isDragging = false;
                  }
              } else {
                isDragging = false;
              }
            }, 500))
            .mouseup(() => {
              if (isDragging && !recentlyNotified) {
                Partup.client.notify.info(TAPi18n.__('activity-dragging-disabled'));
                recentlyNotified = true;

                setTimeout(() => {
                  recentlyNotified = false;
                }, 10000);
              }
              mouseAction = false;
              isDragging = false;
            });
        }
      });
      computation.stop();
    }
  });
});

Template.BoardView.onDestroyed(function() {
    const template = this;

    if (User(Meteor.user()).isPartnerInPartup(template.data.partupId)) {
      template.destroySortable();
    } else {
      // unbind all events used to let user know they can't drag
      $(template.boardEl).unbind();
    }
});

Template.BoardView.helpers({
  lanes: function() {
    const { lanes, shouldUpdate } = Template.instance();
    shouldUpdate.depend();
    return lanes;
  },
  moreThanOneLane: function() {
    const { lanes, shouldUpdate } = Template.instance();
    shouldUpdate.depend();
    return lanes.length;
  },
  editLane: function() {
    return Template.instance().editLane.get();
  },
  addLane: function() {
    return Template.instance().addLane.get();
  },
  isUpper: function() {
    return User(Meteor.user()).isPartnerInPartup(this.partupId);
  },
  loading() {
    return Template.instance().loading.get();
  }
});

Template.BoardView.events({
    'click [data-lane-name]': function(event, template) {
        event.preventDefault();
        if (User(Meteor.user()).isPartnerInPartup(template.data.partupId)) {
          const target = $(event.currentTarget).data('lane-name');
          template.editLane.set(target);
          Meteor.defer(() => {
              $('[data-lane-name-input]').focus();
              $('[data-lane-name-input]')[0].select();
          });
        }
    },
    'keyup [data-lane-name-input]': function(event, template) {
        let $target = $(event.currentTarget);
        let laneId = $target.data('lane-name-input');

        if (event.keyCode === 13) {
          template.editLane.set(undefined);
          Meteor.call('lanes.update_name', laneId, $target.val(), (error) => {
              if (error) {
                Partup.client.notify.error(error.message);
              }
          });
        }
    },
    'blur [data-lane-name-input]': function(event, template) {
      let $target = $(event.currentTarget);
      let laneId = $target.data('lane-name-input');
      template.editLane.set(undefined);
      Meteor.call('lanes.update_name', laneId, $target.val(), (error) => {
        if (error) {
          Partup.client.notify.error(error.message);
        }
      });
    },
    'keyup [data-add-lane-input]': function(event, template) {
        if (event.keyCode === 13) {
            template.addLane.set(false);
            // Not every browser blurs after pressing enter (FF on Mac for example)
            $(':focus').blur(); // Thus we force a blur
        }
    },
    'blur [data-add-lane-input]': function(event, template) {
        let value = $(event.currentTarget).val();
        template.addLane.set(false);
        Meteor.call('lanes.insert', template.board._id, { name: value }, (error, result) => {
          if (error) {
            return Partup.client.notify.error(error.message);
          }
        });
    },
    'click [data-add-button]': function(event, template) {
        event.preventDefault();
        let laneId = $(event.currentTarget).data('add-button');
        template.data.onAdd(laneId, () => {
          const $lane = $(`[data-sortable-lane=${laneId}]`);
          setTimeout(() => {
            $lane.animate({ scrollTop: $lane[0].scrollHeight }, '300');
          }, 250);
        });
    },
    'click [data-remove-button]': function(event, template) {
        event.preventDefault();
        let laneId = $(event.currentTarget).data('remove-button');
        const lane = find(template.lanes, (lane) => lane._id === laneId);
        const newLane =
          template.board.lanes.indexOf(laneId) === 0
          ? template.lanes[1]
          : template.lanes[0];

        Partup.client.prompt.confirm({
            title: TAPi18n.__('prompt-lane-remove-title'),
            message: TAPi18n.__('prompt-lane-remove-message', { fromlane: lane.name, tolane: newLane.name }),
            onConfirm: function() {
              Meteor.call('lanes.remove', laneId, (error) => {
                if (error) {
                  return Partup.client.notify.error(error.message);
                }
                each(template.sortableLanes, (lane, index) => {
                  if (!lane.el || $(lane.el).data('sortable-lane') === laneId) {
                    template.sortableLanes.splice(index, 1);
                    return false;
                  }
                });
              });
            },
        });
    },
    'click [data-add-lane]': function(event, template) {
        event.preventDefault();
        template.addLane.set(true);
        defer(() => {
            $('[data-add-lane-input]').focus();
        });
    },
});


// Used inside the sortable lane
const isMobile = Partup.client.isMobile.isTabletOrMobile();
const scrollOffsetMargin = isMobile ? 35 : 120;
const touchDelay = Partup.client.isMobile.iOS() ? 250 : Partup.client.isMobile.Android() ? 400 : false; // <--- desktop.

// The sortable lib already throttles the handler for us.
const horizontalScrollHandler = function(
  offX,
  offY,
  originalEvent,
  hoverTargetEl,
  touchEvt
) {
  const $boardWrap = $('.content-horizontal');
  const boardWrapEdges = $boardWrap[0].getBoundingClientRect();
  const currentScrollLeft = $boardWrap.scrollLeft();

  const evt = touchEvt || originalEvent;

  if (evt.clientX <= boardWrapEdges.left + scrollOffsetMargin) {
      $boardWrap.scrollLeft(currentScrollLeft - 10);
  } else if (evt.clientX >= boardWrapEdges.right - scrollOffsetMargin) {
      $boardWrap.scrollLeft(currentScrollLeft + 10);
  }

  // This is for scrolling vertically within a lane.
  hoverTargetEl.scrollTop += offY;
};

const createSortableBoard = (DOMNode, handlers) => {
  return Sortable.create(DOMNode, {
    group: {
      name: 'board',
      pull: false,
      put: false,
    },
    delay: touchDelay,
    forceFallback: Partup.client.browser.isChromeOrSafari(),
    animation: 150,
    draggable: '.pu-js-sortable-lane',
    handle: '.pu-boardview-lane__header',
    ghostClass: 'pu-boardview-lane--is-ghost',
    dragClass: 'pu-boardview-lane--is-dragging',
    ...handlers,
  });
}

const createSortableLane = (DOMNode, handlers) => {
  return Sortable.create(DOMNode, {
    group: {
      name: 'lanes',
      pull: true,
      put: true,
    },
    delay: touchDelay,
    animation: 50,
    draggable: '.pu-js-sortable-card',
    filter: '.ignore-drag',
    forceFallback: Partup.client.browser.isChromeOrSafari(),
    preventOnFilter: false,
    ghostClass: 'pu-boardview-card--is-ghost',
    dragClass: 'pu-boardview-card--is-dragging',
    scroll: true,
    scrollFn: horizontalScrollHandler,
    ...handlers,
  });
}

const sortLaneHandle = (template) => ({ from, to, oldIndex, newIndex }) => {
  if (template.waitingForUpdateResult.curValue) {
    debug.log('sortLaneHandle: still waiting on previous request to server');
    return true;
  }

  const fromLaneId = $(from).data('sortable-lane');
  const toLaneId = $(to).data('sortable-lane');

  debug.log('sortLaneHandle called: ', { fromLaneId, toLaneId, oldIndex, newIndex });

  let fromLane;
  let toLane;
  each(template.lanes, (lane) => {
    if (lane._id === fromLaneId) {
      fromLane = lane;
      if (fromLaneId === toLaneId) {
        toLane = lane;
        return false;
      }
    }
    if (lane._id === toLaneId) {
      toLane = lane;
    }
  });

  // Create 'new'! arrays with just the ids that need to be updated, this is used for activity order in lanes.
  const fromLaneActivityIds = fromLane.activities.map((activity) => activity._id);
  const toLaneActivityIds = toLane.activities.map((activity) => activity._id);

  debug.log('current lanes: ', { from: fromLaneActivityIds, to: toLaneActivityIds });

  const activityId = fromLaneActivityIds.splice(oldIndex, 1)[0];
  toLaneActivityIds.splice(newIndex, 0, activityId);

  debug.log('after re-ordering: ', { from: fromLaneActivityIds, to: toLaneActivityIds });

  template.waitingForUpdateResult.set(true);
  Meteor.call('activities.move_lane', activityId, {
    fromLaneId,
    fromLaneActivityIds,
    toLaneId,
    toLaneActivityIds,
  }, (error, result) => {
    template.waitingForUpdateResult.set(false);
    debug.log('call to \'activities.move_lane\' finished', { error, result });
    if (error) {
      Partup.client.notify.error(error.message);
    }
  });
};