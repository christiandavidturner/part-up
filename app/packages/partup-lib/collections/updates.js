import { isString } from 'lodash';

/**
 * Partup model
 * @ignore
 */
Update = function(document) {
    _.extend(this, document);
};

/**
 * Check if given updates last comment is system message
 *
 * @return {Boolean}
 */
Update.prototype.lastCommentIsSystemMessage = function() {
    if (!this.comments) return false;
    if (this.comments.length < 1) return false;
    return !!mout.array.last(this.comments).system;
};

/**
 * Get the last comment
 *
 * @return {Object}
 */
Update.prototype.getLastComment = function() {
    if (!this.comments) return false;
    if (this.comments.length < 1) return false;
    return mout.array.last(this.comments);
};

/**
 * Check if update is related to an activity
 *
 * @return {Boolean}
 */
Update.prototype.isActivityUpdate = function() {
    return (this.type !== 'partups_activities_invited') &&
    (/^partups_activities/.test(this.type) || (
        this.type === 'partups_comments_added' &&
        !this.type_data.contribution_id
    ));
};

/**
 * Check if update is related to a contribution
 *
 * @return {Boolean}
 */
Update.prototype.isContributionUpdate = function() {
  return /^partups_(contributions|ratings)/.test(this.type) || (
      this.type === 'partups_comments_added' &&
      !!this.type_data.contribution_id
  );
};

/**
 * Create the upper_data object for the current user
 *
 * @memberOf Updates
 */
Update.prototype.createUpperDataObject = function(upperId) {
    Updates.update({
        _id: this._id,
        'upper_data._id': {
            $ne: upperId
        }
    }, {
        $push: {
            upper_data: {
                _id: upperId,
                new_comments: []
            }
        }
    });
};

/**
 * Add comment to new_comment in upper_data set
 *
 * @memberOf Updates
 */
Update.prototype.addNewCommentToUpperData = function(comment, upperIds) {
    // Update existing upper data first
    var upper_data = this.upper_data || [];
    upper_data.forEach(function(upperData) {
        if (upperData._id === comment.creator._id) return;
        upperData.new_comments.push(comment._id);
    });

    // Create object for new uppers that dont have upper_data
    var currentUpperDataIds = _.map(upper_data, function(upperData) {
        return upperData._id;
    });

    var newUpperIds = _.difference(upperIds, currentUpperDataIds);
    newUpperIds.forEach(function(upperId) {
        if (upperId === comment.creator._id) return;
        upper_data.push({
            _id: upperId,
            new_comments: [comment._id]
        });
    });

    Updates.update({ _id: this._id }, { $set: { upper_data: upper_data } });
};

/**
 * Check if an update is the last updated update of the partup
 *
 * @memberOf Updates
 */
Update.prototype.isLatestUpdateOfItsPartup = function() {
    var updates = Updates.find({ partup_id: this.partup_id });
    var self = this;
    var isLatestUpdateOfItsPartup = true;
    updates.forEach(function(update) {
        if (update.updated_at > self.updated_at) {
            isLatestUpdateOfItsPartup = false;
        }
    });

    return isLatestUpdateOfItsPartup;
};

/**
 * Check if an given upper is involved in this update
 *
 * @memberOf Updates
 *
 * @return {[String]}
 */
Update.prototype.getInvolvedUppers = function() {
    // Start with the creator of the update
    var uppers = [this.upper_id];

    // Add contributors if update is an activity
    if (this.type_data && this.type_data.activity_id) {
        Contributions.find({ activity_id: this.type_data.activity_id }, { upper_id: 1 }).fetch().forEach(function(contribution) {
            uppers.push(contribution.upper_id);
        });
    }

    // Add uppers that commented on update
    if (this.comments && this.comments.length > 0) {
        this.comments.forEach(function(comment) {
            uppers.push(comment.creator._id);
        });
    }

    // Remove duplicates and return array
    return lodash.unique(uppers);
};

/**
 * @namespace Updates
 * @memberOf Collection
 */
Updates = new Mongo.Collection('updates', {
    transform: function(document) {
        return new Update(document);
    }
});

// Add indices
if (Meteor.isServer) {
    Updates._ensureIndex('type');
    Updates._ensureIndex('upper_id');
    Updates._ensureIndex('partup_id');
    Updates._ensureIndex('updated_at');
    Updates._ensureIndex({ 'partup_id': 1, 'updated_at': -1 });
    Updates._ensureIndex({ 'upper_id': 1, 'type': 1, 'created_at': -1 });
}

/**
 * Find updates for an activity
 *
 * @memberOf Updates
 * @param {Activity} activity
 * @return {Mongo.Cursor}
 */
Updates.findForActivity = function(activity) {
    return Updates.find({ _id: activity.update_id }, { limit: 1 });
};

/**
 * Find updates for partup
 *
 * @memberOf Updates
 * @param {Partup} partup
 * @param {Object} parameters
 * @param {Number} parameters.limit
 * @param {String} parameters.filter
 * @param {String} userId
 * @return {Mongo.Cursor}
 */
Updates.findForPartup = function(partup, parameters, userId) {
    parameters = parameters || {};

    if (Meteor.isClient && !userId) {
        userId = Meteor.userId();
    }

    const partupId = isString(partup) ? partup : partup._id;
    var selector = { partup_id: partupId };
    var options = { sort: { updated_at: -1 } };

    if (parameters.skip) {
      options.skip = parseInt(parameters.skip, 10);
    }
    if (parameters.limit) {
      options.limit = parseInt(parameters.limit, 10);
    }

    if (parameters.filter) {
        var filter = parameters.filter;

        if (filter === 'my-updates') {
            selector.upper_id = userId;
        } else if (filter === 'activities') {
            selector.type = { $regex: '.*activities.*' };
        } else if (filter === 'partup-changes') {
            var regex = '.*(tags|end_date|name|description|image|budget).*';
            selector.type = { $regex: regex };
        } else if (filter === 'messages') {
            selector.type = { $regex: '.*message.*' };
        } else if (filter === 'contributions') {
            selector.type = { $regex: '.*contributions.*' };
        } else if (filter === 'documents-links') {
            selector.$or = [{ has_documents: true }, { has_links: true }];
        } else if (filter === 'documents') {
            selector.has_documents = true;
        } else if (filter === 'links') {
            selector.has_links = true;
        } else if (filter === 'conversations') {
            selector.$or = [
                { type: 'partups_message_added' },
                { type: 'partups_activities_comments_added' },
                { comments_count: { $gt: 0 } }
            ];
            selector.$and = [
                { archived_at: { $exists: false } },
                { deleted_at: { $exists: false } }
            ];
        }
    }

    return this.find(selector, options);
};

Updates.findForPartupsIds = function(partupIds, parameters, userId) {
    parameters = parameters || {};

    if (Meteor.isClient && !userId) {
        userId = Meteor.userId();
    }

    var selector = {partup_id: {$in: partupIds} };
    var options = {sort: {updated_at: -1}};

    options.limit = parseInt(parameters.limit) || 25;
    options.skip = parseInt(parameters.skip) || 0;

    if (parameters.fields) {
        options.fields = parameters.fields;
    }

    if (parameters.filter) {
        var filter = parameters.filter;

        if (filter === 'my-updates') {
            selector.upper_id = userId;
        } else if (filter === 'activities') {
            selector.type = {$regex: '.*activities.*'};
        } else if (filter === 'partup-changes') {
            var regex = '.*(tags|end_date|name|description|image|budget).*';
            selector.type = {$regex: regex};
        } else if (filter === 'messages') {
            selector.type = {$regex: '.*message.*'};
        } else if (filter === 'contributions') {
            selector.type = {$regex: '.*contributions.*'};
        } else if (filter === 'documents-links') {
            selector.$or = [{has_documents: true}, {has_links: true}];
        } else if (filter === 'documents') {
            selector.has_documents = true;
        } else if (filter === 'links') {
            selector.has_links = true;
        } else if (filter === 'conversations') {
            selector.$or = [
                {type: 'partups_message_added'},
                {type: 'partups_activities_comments_added'},
                {comments_count: {$gt: 0}}
            ];
            selector.$and = [
                {archived_at: {$exists: false}},
                {deleted_at: {$exists: false}}
            ];
        }
    }

    return this.find(selector, options);
};
