/**
 * Publish an image
 *
 * @param {String} networkId
 */
Meteor.publish('images.one', function(imageId) {
    check(imageId, String);

    const self = this;
    Slogger.write({
      action: 'images.one',
      type: 'publication',
      data: {
        self
      },
    });


    this.unblock();

    return Images.find({_id: imageId}, {limit: 1});
});

Meteor.publish('images.many', function() {
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'images.many',
      type: 'publication',
      data: {
        self
      },
    });

    if (Meteor.user()) {
        return Images.find();
    }
    throw new Meteor.Error(0, 'unauthorized');
});
