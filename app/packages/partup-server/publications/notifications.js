Meteor.publishComposite('notifications.for_upper', function(limit) {
    check(limit, Number);
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'notifications.for_upper',
      type: 'composite publication',
      data: {
        self,
        limit
      }
    });

    var user = Meteor.users.findOne(this.userId);
    if (!user) return;

    return {
        find: function() {
            return Notifications.findForUser(user, {}, {limit: limit});
        },
        children: [
            {find: Images.findForNotification}
        ]
    };
});

Meteor.publishComposite('notifications.for_upper.by_id', function(notificationId) {
    check(notificationId, String);
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'notifications.for_upper.by_id',
      type: 'composite publication',
      data: {
        self,
      }
    });

    var user = Meteor.users.findOne(this.userId);
    if (!user) return;

    return {
        find: function() {
            return Notifications.findForUser(user, {_id: notificationId});
        },
        children: [
            {find: Images.findForNotification}
        ]
    };
});
