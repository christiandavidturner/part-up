
Meteor.publish('contributions.for_activity', function (activityId) {
  check(activityId, String);
  const self = this;
    Slogger.write({
      action: 'contribution.for_activity',
      type: 'publication',
      data: {
        self
      },
    });
    this.unblock();

    return Contributions.find({ activity_id: activityId });
});
