import { get, each, debounce, throttle, findIndex, contains } from 'lodash';
import UpdatesController from './updatesController';

Template.app_partup_updates.onCreated(function() {
  const template = this;
  this.partup = Partups.findOne(this.data.partupId);
  if (!this.partup) {
    return false;
  }

  this.templateLoaded = new ReactiveVar(false);

  this.updatesController = new UpdatesController({
    partupId: this.data.partupId,
    filter: this.data.defaultFilter || 'default'
  });

});

Template.app_partup_updates.onRendered(function() {
  setTimeout(() => {
    Meteor.defer(() => {
      this.infiniteScollContainerEl = this.parent().parent().find('[data-infinitescroll-container]');
      let previous = 0;
      if (this.infiniteScollContainerEl) {
        this.scrollHandler = throttle(({ target }) => {
          const current = target.scrollTop + target.clientHeight;
          const when = ((target.scrollHeight / 10) * 9) - 200;

          if (current > previous && current >= when) {
            this.updatesController.increaseLimit();
          }
          previous = current;
        }, 500);
        this.infiniteScollContainerEl.addEventListener('scroll', this.scrollHandler, { passive: true });
      }
    });
  }, 50);
  Meteor.defer(() => {
    this.templateLoaded.set(true);
  });
});

Template.app_partup_updates.onDestroyed(function() {
  const self = this;

  if (self.infiniteScollContainerEl) {
    self.infiniteScollContainerEl.removeEventListener('scroll', self.scrollHandler);
  }
  self.updatesController.dispose();
});

Template.app_partup_updates.helpers({
    updates() {
      return Template.instance().updatesController.updates.get();
    },
    newUpdatesCount() {
      return Template.instance().updatesController.newUpdateCount.get();
    },
    isAnotherDay() {
      const update = this;
      const updates = Template.instance().updatesController.updates.curValue;
      const key = 'updated_at';

      const currentIndex = findIndex(updates, update);
      const previousUpdate = updates[currentIndex - 1];

      return Partup.client.moment.isAnotherDay(
        moment(previousUpdate && previousUpdate[key]),
        moment(updates[currentIndex][key]),
      );
    },
    filterHandle() {
      return Template.instance().updatesController.filter;
    },
    showNewMessageButton: function () {
      return [
        'messages',
        'conversations',
        'documents-links'
      ].find((tab) => tab === this.defaultFilter) || !this.defaultFilter;
    },
    routeIsAllUpdates() {
      return !this.defaultFilter;
    },
    routeIsDocuments() {
      return this.defaultFilter === 'documents-links';
    },
    showNewUpdatesSeparator() {
      const update = this;
      const template = Template.instance();
      const { refreshDate, previousRefreshDate, updates } = template.updatesController;

      let showSeperator = false;
      const currentUpdates = updates.curValue;

      const updateIsNew = moment(previousRefreshDate).diff(moment(update.updated_at)) < 0;
      const nextUpdate = currentUpdates[currentUpdates.indexOf(update) + 1];

      if (!nextUpdate && updateIsNew) {
        return true;
      }
      showSeperator = updateIsNew && nextUpdate && moment(previousRefreshDate).diff(moment(nextUpdate.updated_at)) > 0;

      if (showSeperator) {
        Meteor.defer(() => {
          setTimeout(() => {
            let DOMNode = template.find('.pu-sub-newupdatesseparator');
            const inView = (node) => {
              if (node && node.offsetTop) {
                return node.offsetTop >= 0 && node.offsetTop + node.clientHeight <= window.innerHeight;
              } else {
                return false;
              }
            }
            if (inView(DOMNode)) {
              removeSeperator(DOMNode);
            } else {
              const handler = throttle((evt) => {
                DOMNode = template.find('.pu-sub-newupdatesseparator');
                if (inView(DOMNode)) {
                  template.containerEl.removeEventListener('scroll', handler);
                  removeSeperator(DOMNode);
                }
              }, 250);
              template.containerEl.addEventListener('scroll', handler, { passive: true});
            }
          }, 500);
        });
      }
      return showSeperator;
    },
    templateLoaded() {
      return Template.instance().templateLoaded.get();
    },
    loading() {
      return !Template.instance().updatesController.initialized.get();
    },
    loadingMore() {
      return Template.instance().updatesController.loadingMore.get();
    },
    endReached() {
      return Template.instance().updatesController.endReached.get();
    },
});

Template.app_partup_updates.events({
  'click [data-trigger-load]'(event, { updatesController }) {
    updatesController.increaseLimit();
  },
  'click [data-newmessage-popup]'(event) {
    event.preventDefault();
    const open = () => {
      Partup.client.popup.open({
        id: 'new-message',
      });
    };
    if (Meteor.userId()) {
      open();
    } else {
      Intent.go({route: 'login'}, (user) => {
        if (user) {
          Meteor.setTimeout(open, 500);
        }
      });
    };
  },
  'click [data-reveal-new-updates]'(event, { data: { partupId }, updatesController }) {
    event.preventDefault();
    updatesController.previousRefreshDate = updatesController.refreshDate;
    updatesController.increaseLimit(updatesController.newUpdateCount.curValue);
    updatesController.newUpdateCount.set(0);

    // Reset new updates for current user
    Meteor.call('partups.reset_new_updates', partupId);
  }
});

const removeSeperator = (node) => {
  if (node) {
    Meteor.setTimeout(() => {
      node.classList.remove('pu-state-active');
      setTimeout(() => {
        if (!node.parentNode) {
          return;
        }
        node.parentNode.removeChild(node);
      }, 810);
    }, 5000);
  }
}