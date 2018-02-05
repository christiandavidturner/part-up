import { get } from 'lodash';

/* eslint-disable no-var */

// For the collection events documentation, see [https://github.com/matb33/meteor-collection-hooks].
var equal = Npm.require('deeper');

/**
 * Generate a basic after insert handler.
 *
 * @param {String} namespace
 * @return {function}
 * @ignore
 */
var basicAfterInsert = function(namespace) {
    return function(userId, document) {

        // If no userId is present, try getting it from the document
        // Used for User-API access, as no user is specified
        if (!userId) {
            userId = document.creator_id ||
                     document.upper_id ||
                     get(document, 'type_data.creator._id')
        }

        Event.emit(namespace + '.inserted', userId, document);
    };
};

/**
 * Generate a basic after update handler.
 *
 * @param {String} namespace
 *
 * @return {function}
 * @ignore
 */
var basicAfterUpdate = function(namespace) {
    return function(userId, document, fieldNames, modifier, options) {

        // If no userId is present, try getting it from the document
        // Used for User-API access, as no user is specified
        if (!userId) {
            userId = document.creator_id ||
                     document.upper_id ||
                     get(document, 'type_data.creator._id')
        }

        Event.emit(namespace + '.updated', userId, document, this.previous);

        if (this.previous) {
            var previous = this.previous;

            fieldNames.forEach(function(key) {
                var value = {
                    'name': key,
                    'old': previous[key],
                    'new': document[key]
                };

                if (equal(value.old, value.new)) return;

                Event.emit(namespace + '.' + key + '.changed', userId, document, value);
            });
        }
    };
};

/**
 * Generate a basic after remove handler.
 *
 * @param {String} namespace
 *
 * @return {function}
 * @ignore
 */
var basicAfterRemove = function(namespace) {
    return function(userId, document) {
        Event.emit(namespace + '.removed', userId, document);
    };
};

var logFind = function(collection) {
  return function(userId, doc, ...args) {
    const afterFindLog = {
      action: 'find',
      type: 'collection find',
      data: {
        userId,
        collection,
        doc,
      },
    };

    const fields = get(args[0], 'fields');
    if (fields) {
      afterFindLog.data.fields = fields;
    }

    const cursor = args[1];
    // http://docs.meteor.com/api/collections.html#Mongo-Cursor-observeChanges
    if (cursor && cursor.observeChanges) {
      const cursorDescription = cursor._cursorDescription;
      cursor.observeChanges({
        added(id, fields) {
          Slogger.write({
            action: 'added',
            type: 'cursor changed',
            data: {
              id,
              fields,
              cursorDescription,
            },
          });
        },
        changed(id, fields) {
          Slogger.write({
            action: 'addedBefore',
            type: 'cursor changed',
            data: {
              id,
              fields,
              cursorDescription,
            },
          });
        },
        movedBefore(id, before) {
          Slogger.write({
            action: 'movedBefore',
            type: 'cursor changed',
            data: {
              id,
              before,
              cursorDescription,
            },
          });
        },
        removed(id) {
          Slogger.write({
            action: 'removed',
            type: 'cursor changed',
            data: {
              id,
            },
          });
        },
      });
    }

    Slogger.write(afterFindLog);
  };
};


// Partup Events
Partups.after.insert(basicAfterInsert('partups'));
Partups.after.update(basicAfterUpdate('partups'));
Partups.after.remove(basicAfterRemove('partups'));


// Networks Events
Networks.after.insert(basicAfterInsert('networks'));
Networks.after.update(basicAfterUpdate('networks'));
Networks.after.remove(basicAfterRemove('networks'));

// Activity Events
Activities.after.insert(basicAfterInsert('partups.activities'));
Activities.after.update(basicAfterUpdate('partups.activities'));
Activities.after.remove(basicAfterRemove('partups.activities'));

// Update Events
Updates.hookOptions.after.update = {fetchPrevious: false};
Updates.after.insert(basicAfterInsert('partups.updates'));
Updates.after.update(basicAfterUpdate('partups.updates'));
Updates.after.remove(basicAfterRemove('partups.updates'));

// Contribution Events
Contributions.after.insert(basicAfterInsert('partups.contributions'));
Contributions.after.update(basicAfterUpdate('partups.contributions'));
Contributions.after.remove(basicAfterRemove('partups.contributions'));

// Ratings Events
Ratings.after.insert(basicAfterInsert('partups.contributions.ratings'));
Ratings.after.update(basicAfterUpdate('partups.contributions.ratings'));
Ratings.after.remove(basicAfterRemove('partups.contributions.ratings'));

// Notifications Events
Notifications.after.insert(basicAfterInsert('partups.notifications'));

const collections = [
  Ratings,
  Contributions,
  Partups,
  Networks,
  Activities,
  Updates,
  Notifications,
  Boards,
  ChatMessages,
  Chats,
  ContentBlocks,
  Files,
  Images,
  Invites,
  Lanes,
  Languages,
  Places,
  Sectors,
  Swarms,
  Tags,
  Tiles,
  Meteor.users
];

collections.forEach((col) => {
  // col.before.find(logFind(`${col._name}:before`));
  col.after.find(logFind(`${col._name}:after`));
});
