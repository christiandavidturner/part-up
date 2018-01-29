import Enum from 'enum';
import { noop } from 'lodash';

const flags = [
  'FEATURE_FLAG_HOME',
];
const currentFlags = {};
for (const k of Object.keys(Meteor.settings.public)) {
  if (flags.includes(k)) {
    if (Meteor.settings.public[k]) {
      currentFlags[k] = k;
    }
  }
}

const FEATURE_FLAGS = new Enum(currentFlags);
FEATURE_FLAGS.isFlaggable = false;

const features = {
  when(val, cb = noop) {
    if (Meteor.isDevelopment || val) {
      cb();
    }
  },
};
Object.freeze(features);

export {
  FEATURE_FLAGS,
};
export default features;
