
Meteor.methods({
  partup_user_settings(partupId) {
    if (Meteor.userId()) {
      let settings =  PartupUserSettings.findOne({ user_id: Meteor.userId(), partup_id: partupId });

      if (!settings) {
        const landing_page = User(Meteor.user()).isPartnerOrSupporterInPartup(partupId) ? 'conversations' : 'start';
        settings = {
          partup_id: partupId,
          user_id: Meteor.userId(),
          landing_page,
        };

        try {
          PartupUserSettings.insert(settings);
        } catch (error) {
          Log.error(error);
        }
      }

      return settings;
    }
  },
});
