Meteor.startup(function() {
  if (process.env.NODE_ENV.match(/development|staging/)) {

    if (!PartupUserSettings.find().count()) {

      PartupUserSettings.insert({
        partup_id: 'ASfRYBAzo2ayYk5si',
        user_id: 'q63Kii9wwJX3Q6rHS',
        landing_page: 'start',
      });
      PartupUserSettings.insert({
        partup_id: 'vGaxNojSerdizDPjd',
        user_id: 'q63Kii9wwJX3Q6rHS',
        landing_page: 'conversations',
      });
    }
  }
});
