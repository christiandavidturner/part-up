Meteor.publishComposite('tiles.profile', function(upperId) {
    check(upperId, String);

    const self = this;
    Slogger.write({
      action: 'tiles.profile',
      type: 'composite publication',
      data: {
        self,
      }
    });

    this.unblock();

    return {
        find: function() {
            return Tiles.find({upper_id: upperId});
        },
        children: [
            {find: Images.findForTile}
        ]
    };
});
