/**
 * Publish all sectors
 *
 */
Meteor.publishComposite('sectors.all', function() {

  const self = this;
    Slogger.write({
      action: 'sectors.all',
      type: 'composite publication',
      data: {
        self,
      }
    });

    return {
        find: function() {
            return Sectors.find();
        }
    };
});
