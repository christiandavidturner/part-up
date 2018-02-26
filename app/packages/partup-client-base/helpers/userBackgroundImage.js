import { get } from 'lodash';
const { debug } = Partup.client;

Template.registerHelper('userBackgroundImage', (userId, size) => {
  let backgroundUrl = '';
  if (userId) {
    const user = Meteor.users.find({ _id: userId }, { fields: { 'profile.image': 1 } }).fetch().pop();
    if (user) {
      const imageId = Images.findOne(get(user, 'profile.image'));
      if (imageId) {
        const imageUrl = Partup.helpers.url.getImageUrl(imageId, size);
        backgroundUrl = `background-image: url(${imageUrl});`;
      } else {
        debug.log('userBackgroundImage helper could not find an image with Id, make sure there is a subscription', imageId);
      }
    } else {
      debug.log('userBackgroundImage helper could not find a user with Id, make sure there is a subscription', userId);
    }
  }
  return backgroundUrl;
});
