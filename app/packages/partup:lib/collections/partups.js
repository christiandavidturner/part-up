/**
 * @memberof Partups
 * @private
 */
var PUBLIC = 1;
/**
 * @memberof Partups
 * @private
 */
var PRIVATE = 2;
/**
 * @memberof Partups
 * @private
 */
var NETWORK_PUBLIC = 3;
/**
 * @memberof Partups
 * @private
 */
var NETWORK_INVITE = 4;
/**
 * @memberof Partups
 * @private
 */
var NETWORK_CLOSED = 5;

/**
 * @ignore
 */
var Partup = function(document) {
    _.extend(this, document);
};

/**
 * Check if a given user can edit this partup
 *
 * @memberof Partups
 * @param {User} user the user object
 * @return {Boolean}
 */
Partup.prototype.isEditableBy = function(user) {
    var uppers = this.uppers || [];

    return user && uppers.indexOf(user._id) > -1;
};

/**
 * Check if a given user can remove this partup
 *
 * @memberof Partups
 * @param {User} user the user object
 * @return {Boolean}
 */
Partup.prototype.isRemovableBy = function(user) {
    return user && this.creator_id === user._id;
};

/**
 * Check if given user is a supporter of this partup
 *
 * @memberof Partups
 * @param {String} userId the user id of the user that should be checked
 * @return {Boolean}
 */
Partup.prototype.hasSupporter = function(userId) {
    return mout.lang.isString(userId) && this.supporters.indexOf(userId) > -1;
};

/**
 * Check if given user is an upper in this partup
 *
 * @memberof Partups
 * @param {String} userId the user id of the user that should be checked
 * @return {Boolean}
 */
Partup.prototype.hasUpper = function(userId) {
    return mout.lang.isString(userId) && this.uppers.indexOf(userId) > -1;
};

/**
 Partups describe collaborations between several uppers
 @namespace Partups
 */
Partups = new Mongo.Collection('partups', {
    transform: function(document) {
        return new Partup(document);
    }
});

/**
 * @memberof Partups
 * @public
 */
Partups.PUBLIC = PUBLIC;
/**
 * @memberof Partups
 * @public
 */
Partups.PRIVATE = PRIVATE;
/**
 * @memberof Partups
 * @public
 */
Partups.NETWORK_PUBLIC = NETWORK_PUBLIC;
/**
 * @memberof Partups
 * @public
 */
Partups.NETWORK_INVITE = NETWORK_INVITE;
/**
 * @memberof Partups
 * @public
 */
Partups.NETWORK_CLOSED = NETWORK_CLOSED;

/**
 * ============== PARTUPS COLLECTION HELPERS ==============
 */

/**
 * Modified version of Collection.find that makes sure the
 * user (or guest) can only retrieve authorized entities
 *
 * @memberof Partups
 * @param {String} userId
 * @param {Object} selector
 * @param {Object} options
 * @return {Cursor}
 */
Partups.guardedFind = function(userId, selector, options) {
    var selector = selector || {};
    var options = options || {};

    var guardedCriterias = [
        // Either the partup is public or belongs to a public network
        {'privacy_type': {'$in': [Partups.PUBLIC, Partups.NETWORK_PUBLIC]}},
    ];

    // Some extra rules that are only applicable to users that are logged in
    if (userId) {
        // The user is part of the partup uppers, which means he has access anyway
        guardedCriterias.push({'uppers': {'$in': [userId]}});

        // Of course the creator of a partup always has the needed rights
        guardedCriterias.push({'creator_id': userId});
    }

    // Guarding selector that needs to be fulfilled
    var guardingSelector = {'$or': guardedCriterias};

    // Merge the selectors, so we still use the initial selector provided by the caller
    var finalSelector = {'$and': [guardingSelector, selector]};

    return this.find(finalSelector, options);
};

/**
 * Find the partups used in the discover page
 *
 * @memberof Partups
 * @param {Object} options
 * @return {Cursor}
 */
Partups.findForDiscover = function(userId, options) {
    var selector = {};
    var options = options || {};

    var limit = options.count ? null : parseInt(options.limit) || 20;
    var query = options.query || false;
    var location = options.location || false;
    var networkId = options.networkId || false;
    var sort = options.count ? null : options.sort || false;

    if (!options.count) {

        // Initialize
        options.sort = {};

        // Set limit for pagination
        options.limit = limit;

        // Sort the partups from the newest to the oldest
        if (sort === 'new') {
            options.sort['updated_at'] = -1;
        }

        // Sort the partups from the most popular to the least popular
        if (sort === 'popular') {
            options.sort['analytics.clicks_per_day'] = -1;
        }
    }

    // Filter the partups that are in a given location
    if (location) {
        selector['location.city'] = location;
    }

    // Filter the partups that are in a given network
    if (networkId) {
        selector['network_id'] = networkId;
    }

    // Filter the partups that match the search query
    if (query) {
        Log.debug('Searching for [' + query + ']');

        selector['$text'] = {$search: query};
        options.fields = {score: {$meta: 'textScore'}};

        if (!options.count) {
            options.sort['score'] = {$meta: 'textScore'};
        }
    }

    return this.guardedFind(userId, selector, options);
};

/**
 * Find the partups used on the network page
 *
 * @memberof Partups
 * @param {Object} options
 * @return {Cursor}
 */
Partups.findForNetwork = function(userId, options) {
    var selector = {};
    var options = options || {};

    var limit = options.count ? null : parseInt(options.limit) || 20;
    var networkId = options.networkId || false;
    var sort = options.count ? null : options.sort || false;

    if (!options.count) {

        // Initialize
        options.sort = {};

        // Set limit for pagination
        options.limit = limit;

        // Sort the partups from the newest to the oldest
        options.sort['updated_at'] = -1;
    }

    // Filter the partups that are in a given network
    if (networkId) {
        selector['network_id'] = networkId;
    }

    return this.guardedFind(userId, selector, options);
};
