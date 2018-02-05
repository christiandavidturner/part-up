/**
 * Publish all languages of partups
 *
 */
Meteor.publishComposite('languages.all', function() {
  const self = this;
    Slogger.write({
      action: 'languages.all',
      type: 'composite publication',
      data: {
        self,
      }
    });
    return {
        find: function() {
            return Languages.find();
        }
    };
});
