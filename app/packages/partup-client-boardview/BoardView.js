import Sortable from './Sortable';

Template.BoardView.onCreated(function() {
    let template = this;
    let partupId = template.data.partupId;

    template.dragging = new ReactiveVar(false);
    template.editLane = new ReactiveVar(undefined);
    template.addLane = new ReactiveVar(false);

    template.loaded = new ReactiveVar(false, function(a, b) {
        if (!b) return;
        template.updateLanesCollection();
        lodash.defer(function() {
            let partup = Partups.findOne({ _id: template.data.partupId });

            // only kickstart the board when the user is an upper
            if (partup.hasUpper(Meteor.userId())) {
                template.createBoard();
                lodash.defer(function() {
                    template.createLanes();
                });
            }
        });
    });

    let arraysAreTheSame = function(arr1, arr2) {
        return JSON.stringify(arr1) === JSON.stringify(arr2);
    };

    let callBoardUpdate = function(laneIds) {
        let board = Boards.findOne({ partup_id: partupId });
        if (!board) return;

        Meteor.call(
            'boards.update',
            board._id,
            { lanes: laneIds || [] },
            function(err, res) {
                if (err) return Partup.client.notify.error(err.message);
            }
        );
    };

    template.updateBoard = function() {
        let boardLanes = template.$('[data-sortable-board] [data-lane]');
        let lanes = $.map(boardLanes, function(laneElement, index) {
            return $(laneElement).data('lane');
        });

        // Update board lanes.
        callBoardUpdate(lanes);
    };

    let callLaneUpdateActivities = function(laneId, activityIds) {
        if (!laneId) return;
        Meteor.call(
            'lanes.update_activities',
            laneId,
            activityIds || [],
            function(err, res) {
                if (err) return Partup.client.notify.error(err.message);
            }
        );
    };

    let callActivityUpdateLane = function(activityId, laneId) {
        if (!activityId || !laneId) return;
        Meteor.call('activities.update_lane', activityId, laneId, function(
            err,
            res
        ) {
            if (err) return Partup.client.notify.error(err.message);
        });
    };

    template.updateLane = function(fromLane, toLane, activity) {
        let $fromLane = $(fromLane);
        let $toLane = $(toLane);
        let $activity = $(activity);

        let fromLaneId = $fromLane.data('sortable-lane');
        let toLaneId = $toLane.data('sortable-lane');
        let activityId = $activity.data('activity');

        let fromLaneActivityElements = $fromLane.find('[data-activity]');
        let toLaneActivityElements = $toLane.find('[data-activity]');

        let fromLaneActivities = $.map(fromLaneActivityElements, function(
            activityElement,
            index
        ) {
            return $(activityElement).data('activity');
        });

        let toLaneActivities = $.map(toLaneActivityElements, function(
            activityElement,
            index
        ) {
            return $(activityElement).data('activity');
        });

        // lane.onSort will be called twice if the activity is moved to another lane,
        // once if it is moved up or down in the same lane.
        // Because of this we compare the two lanes (fromLane and toLane):
        // If they are the same, we update only the fromLane.
        // If they differ, we update the toLane and the activity that is moved.
        // This way we make sure only one update call is executed per lane.
        if (arraysAreTheSame(fromLaneActivities, toLaneActivities)) {
            callLaneUpdateActivities(fromLaneId, fromLaneActivities);
        } else {
            callLaneUpdateActivities(toLaneId, toLaneActivities);
            callActivityUpdateLane(activityId, toLaneId);
        }
    };

    template.updateLaneName = function(laneId, name) {
        if (!laneId || !name) return;
        Meteor.call('lanes.update_name', laneId, name, function(err, res) {
            if (err) return Partup.client.notify.error(err.message);
        });
    };

    template.callInsertLane = function(laneName) {
        let board = Boards.findOne();
        if (!board || !laneName) return;

        Meteor.call('lanes.insert', board._id, { name: laneName }, function(
            err,
            res
        ) {
            if (err) return Partup.client.notify.error(err.message);
            template.refresh();
        });
    };

    template.callRemoveLane = function(laneId) {
        Meteor.call('lanes.remove', laneId, function(err, res) {
            if (err) return Partup.client.notify.error(err.message);
            template.refresh();
        });
    };

    template.startDrag = function() {
        setTimeout(function() {
            template.dragging.set(true);
        }, 250);
    };

    template.endDrag = function() {
        setTimeout(function() {
            template.dragging.set(false);
        }, 250);
    };

    const touchDelay = Partup.client.isMobile.iOS()
        ? 250
        : Partup.client.isMobile.Android() ? 400 : false; // <--- desktop.

    template.createBoard = function() {
        let boardElement = template.$('[data-sortable-board]')[0];
        if (!boardElement) return;

        template.sortableBoard = Sortable.create(boardElement, {
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
            onStart: template.startDrag,
            onEnd: template.endDrag,
            onUpdate: template.updateBoard,
        });
    };

    template.sortableLanes = [];

    // Used inside the sortable lane
    const isMobile = Partup.client.isMobile.isTabletOrMobile();
    const scrollOffsetMargin = isMobile ? 35 : 120;

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

    template.createLanes = function() {
        template.$('[data-sortable-lane]').each(function(index, laneElement) {
            let sortableLane = Sortable.create(laneElement, {
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
                onStart: async () => {
                    template.startDrag();
                    // console.log('start drag');
                },
                onEnd: async () => {
                    template.endDrag();
                    // console.log('end drag');
                },
                onSort: async function(event) {
                    template.updateLane(event.from, event.to, event.item);
                    // console.log('sort');
                },
                scroll: true,
                scrollFn: horizontalScrollHandler,
            });

            template.sortableLanes.push(sortableLane);
        });
    };

    template.destroyBoard = function() {
        for (let i = 0; i < template.sortableLanes.length; i++) {
            let lane = template.sortableLanes.pop();
            lane.destroy();
        }

        if (template.sortableBoard) template.sortableBoard.destroy();
    };

    template.refresh = function() {
        template.destroyBoard();
        template.createBoard();
        lodash.defer(function() {
            template.createLanes();
        });
    };

    template.lanesCollection = new ReactiveVar([]);
    template.updateLanesCollection = function() {
        let board = Boards.findOne();
        if (!board) return;

        let lanes = ((board && board.lanes) || []).map(function(
            laneId,
            laneIndex
        ) {
            let lane = Lanes.findOne(laneId);
            if (!lane) return [];

            lane.activities = ((lane && lane.activities) || [])
                .map(function(activityId, activityIndex) {
                    return Activities.findOne(activityId);
                })
                .filter(function(activity) {
                    return activity && !activity.isRemoved();
                });

            lane.activitiesCount = lane.activities.length;

            return lane;
        });

        template.lanesCollection.set(lanes);
    };

    template.userIsUpper = function() {
        let partup = Partups.findOne({ _id: template.data.partupId });
        if (!partup || !partup.uppers) return false;

        let user = Meteor.user();
        if (!user) return false;

        return partup.uppers.indexOf(user._id) > -1;
    };

    template.autorun(function() {
        let board = Boards.findOne();

        let dragging = template.dragging.get();
        if (!board || dragging) return;

        let lanes = ((board && board.lanes) || []).map(function(
            laneId,
            laneIndex
        ) {
            let lane = Lanes.findOne(laneId);

            if (!lane) return [];

            lane.activities = ((lane && lane.activities) || [])
                .map(function(activityId, activityIndex) {
                    return Activities.findOne(activityId);
                })
                .filter(function(activity) {
                    return !!(activity && !activity.isRemoved());
                });

            lane.activitiesCount = lane.activities.length;

            return lane;
        });

        template.lanesCollection.set(lanes);
    });
});

Template.BoardView.onRendered(function() {
    this.loaded.set(true);
});

Template.BoardView.onDestroyed(function() {
    let template = this;
    template.destroyBoard();
});

Template.BoardView.events({
    'click [data-lane-name]': function(event, template) {
        event.preventDefault();
        if (!template.userIsUpper()) return;
        template.editLane.set($(event.currentTarget).data('lane-name'));
        lodash.defer(function() {
            $('[data-lane-name-input]').focus();
            $('[data-lane-name-input]')[0].select();
        });
    },
    'keyup [data-lane-name-input]': function(event, template) {
        let value = $(event.currentTarget).val();
        let laneId = $(event.currentTarget).data('lane-name-input');
        if (event.keyCode === 13) {
            template.editLane.set(undefined);
            template.updateLaneName(laneId, value);
        }
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
        template.callInsertLane(value);
    },
    'blur [data-lane-name-input]': function(event, template) {
        let value = $(event.currentTarget).val();
        let laneId = $(event.currentTarget).data('lane-name-input');
        template.editLane.set(undefined);
        template.updateLaneName(laneId, value);
    },
    'click [data-add-button]': function(event, template) {
        event.preventDefault();
        let laneId = $(event.currentTarget).data('add-button');
        template.data.onAdd(laneId);
    },
    'click [data-remove-button]': function(event, template) {
        event.preventDefault();
        let laneId = $(event.currentTarget).data('remove-button');
        let board = Boards.findOne({ partup_id: template.data.partupId });
        let thisLane = Lanes.findOne({ _id: laneId });
        let newLane;
        if (board.lanes.indexOf(laneId) === 0) {
            newLane = Lanes.findOne({ _id: board.lanes[1] });
        } else {
            newLane = Lanes.findOne({ _id: board.lanes[0] });
        }

        Partup.client.prompt.confirm({
            title: 'Weet je het zeker?',
            message:
                'Als je ' +
                thisLane.name +
                ' verwijdert, worden alle activiteiten van ' +
                thisLane.name +
                ' verplaatst naar ' +
                newLane.name,
            onConfirm: function() {
                template.callRemoveLane(laneId);
            },
        });
    },
    'click [data-add-lane]': function(event, template) {
        event.preventDefault();
        template.addLane.set(true);
        lodash.defer(function() {
            $('[data-add-lane-input]').focus();
        });
    },
});

Template.BoardView.helpers({
    lanes: function() {
        let template = Template.instance();
        return template.lanesCollection.get();
    },
    moreThanOneLane: function() {
        let template = Template.instance();
        let lanes = template.lanesCollection.get();
        return !!(lanes.length > 1);
    },
    editLane: function() {
        return Template.instance().editLane.get();
    },
    addLane: function() {
        return Template.instance().addLane.get();
    },
    isUpper: function() {
        return Template.instance().userIsUpper();
    },
    loaded() {
        return Template.instance().loaded.get();
    },
});
