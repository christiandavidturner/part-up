import { isString } from 'lodash';

Template.app_partup_update.onCreated(function() {
  const template = this;

  this.loading = new ReactiveVar(true);
  if (isString(this.data.updateId)) {
    // The update may already be present from caching
    // This will be the case when a user comes from a different route.
    // This will not be the case when a user directs here via a notification
    if (!Updates.findOne(this.data.updateId)) {
      this.subscribe('updates.single', this.data.updateId, this.data.partupId, {
        onReady: () => {
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
    // Reset new comments for current user
    Meteor.call('updates.reset_new_comments', this.data.updateId);
  }
});

Template.app_partup_update.helpers({
  update() {
    return Updates.findOne(this.updateId);
  },
  isAnotherDay: function(date) {
    return Partup.client.moment.isAnotherDay(moment(), moment(date));
  },
  loading() {
    return Template.instance().loading.get();
  }
});
