import Enum from 'enum';

const enumObj = {};
const flags = [
  'FEATURE_FLAG_HOME',
];
for (const k of Object.keys(Meteor.settings.public)) {
  if (flags.includes(k)) {
    enumObj[k] = Meteor.settings.public[k];
  }
}

const flagEnum = new Enum(enumObj);
flagEnum.isFlaggable = false;

const features = {
  when(val, cb) {
    if (Meteor.isDevelopment || flagEnum.has(val)) {
      cb();
    }
  },
};

Object.freeze(features);
export default features;
