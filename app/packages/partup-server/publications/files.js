/**
 * Publish a file
 *
 * @param {String} fileId
 */
Meteor.publish('files.one', function(fileId) {
    check(fileId, String);

    const self = this;
    Slogger.write({
      action: 'files.one',
      type: 'publication',
      data: {
        self
      },
    });

    this.unblock();

    return Files.find({_id: fileId}, {limit: 1});
});

Meteor.publish('files.many', function() {
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'files.many',
      type: 'publication',
      data: {
        self
      },
    });

    if (Meteor.user()) {
        return Files.find();
    }
    return [];
});
