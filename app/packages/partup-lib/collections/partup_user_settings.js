
PartupUserSettings = new Mongo.Collection('partupusersettings');

if (Meteor.isServer) {
  PartupUserSettings._ensureIndex({ 'partup_id': 1, 'user_id': 1 });
}

const LANDING_PAGES = {
  start: 'start',
  conversations: 'conversations',
};

const isValidLandingPage = (page) => {
  return Object.keys(LANDING_PAGES).includes(page.toLowerCase());
}

PartupUserSettings.setLandingPage = function(partupId, userId, page) {
  const settings = this.findOne({ partup_id: partupId, user_id: userId });

  if (isValidLandingPage(page) && settings) {
    this.update(settings._id, { landing_page: page });
  }
}
