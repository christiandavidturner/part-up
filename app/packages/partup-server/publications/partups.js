/**
 * Gets all partsups for a user.
 */
Meteor.routeComposite('/partups/me', function(request, parameters) {
    const userId = parameters.query.userId || this.userId;

    const user = Meteor.users.findOne(userId, { fields: { _id: 1, upperOf: 1, supporterOf: 1 } });

    const partupsCursor = Partups.guardedFind(user, { _id: { $in: [
        ...(user.upperOf || []),
        ...(user.supporterOf || []),
    ]}}, {fields: {_id: 1, name: 1, image: 1, upper_data: 1}, sort: { popularity: -1 }});

    return {
        find: () => partupsCursor,
    }
});


Meteor.routeComposite('/partups/start', function(request, parameters) {
    const userId = parameters.query.userId || this.userId;
    const partupId = parameters.query.partupId;

    const user = Meteor.users.findOne(userId, { fields: { _id: 1, upperOf: 1, supporterOf: 1 } });

    const partupsCursor = Partups.find({ _id: partupId }, {
        fields: {
            _id: 1,
            name: 1,
            image: 1,
            upper_data: 1,
            tags: 1,
            slug: 1,
            description: 1,
            expected_result: 1,
            motivation: 1,
            network_id: 1,
            uppers: 1,
            creator_id: 1,
            starred_updates: 1,
            pending_partners: 1,
        },
    });

    const partup = partupsCursor.fetch().pop();

    const starredUpdates = Updates.find({
        _id: {$in: partup.starred_updates || []},
    }, {
        sort: { updated_at: -1 },
        fields: { comments: 0 },
    });

    const updateUserIds = starredUpdates.map(({upper_id}) => upper_id);
    const updateFileIds = starredUpdates.fetch()
        .filter(({ type_data }) => type_data && type_data.documents)
        .map(({ type_data }) => type_data.documents)
        .reduce((x, y) => x.concat(y), []);
    const updateImageIds = starredUpdates.fetch()
        .filter(({ type_data }) => type_data && type_data.images)
        .map(({ type_data }) => type_data.images)
        .reduce((x, y) => x.concat(y), []);

    const starredUpdatesIds = starredUpdates.map(({_id}) => _id);
    const networksCursor = Networks.find({_id: partup.network_id }, {fields: {_id: 1, name: 1}});

    const invitesCursor = Invites.find({
        partup_id: partupId,
        invitee_id: user ? user._id : null,
        type: 'partup_existing_upper',
    });

    const userIds = Array.from(new Set([
        partup.creator_id,
        ...(partup.uppers || []),
        ...(updateUserIds || []),
    ]));

    const usersCursor = Meteor.users.find({_id: {$in: userIds}}, {fields: {'_id': 1, 'name': 1, 'image': 1, 'profile.image': 1, 'profile.name': 1}});

    // find all activities for userPartupUpdates
    const activitiesCursor = Activities.findForUpdateIds(starredUpdatesIds);
    const activityLaneIds = activitiesCursor.map(({lane_id}) => lane_id);
    const activityImageIds = activitiesCursor
        .fetch()
        .filter(({ files }) => files && files.images)
        .map(({ files }) => files.images)
        .reduce((x, y) => x.concat(y), []);
    const activityFilesIds = activitiesCursor
        .fetch()
        .filter(({ files }) => files && files.documents)
        .map(({ files }) => files.documents)
        .reduce((x, y) => x.concat(y), []);

    const filesCursor = Files.find({_id: {$in: [
        ...(updateFileIds || []),
        ...(activityFilesIds || []),
    ]}});

    const additionalImagesCursor = Images.find({_id: {$in: [
        ...(updateImageIds || []),
        ...(activityImageIds || []),
    ]}});

    // find lanes for activities
    const lanesCursor = Lanes.find({_id: {$in: activityLaneIds}});

    // find all asociated images for collections
    const imagesCursor = Images.findForCursors([{
        cursor: usersCursor,
        imageKey: 'profile.image',
    }, {
        cursor: partupsCursor,
        imageKey: 'image',
    }, {
        cursor: starredUpdates,
        imageKey: 'type_data.old_image',
    }, {
        cursor: starredUpdates,
        imageKey: 'type_data.new_image',
    }, {
        cursor: starredUpdates,
        imageKey: 'type_data.images',
    }]);


    return {
        find: () => partupsCursor,
        children: [
            {find: () => invitesCursor},
            {find: () => usersCursor},
            {find: () => imagesCursor},
            {find: () => additionalImagesCursor},
            {find: () => filesCursor},
            {find: () => networksCursor},
            {find: () => starredUpdates},
            {find: () => activitiesCursor},
            {find: () => lanesCursor},
        ],
    };
});
/**
 * Gets all conversation updates for a user's partup.
 */
Meteor.routeComposite('/partups/updates', function(request, parameters) {
    check(parameters.query, {
        limit: Match.Optional(String),
        skip: Match.Optional(String),
        userId: Match.Optional(String),
        upperOnly: Match.Optional(String),
        supporterOnly: Match.Optional(String),
        partupId: Match.Optional(String),
    });

    const options = {};

    options.limit = parseInt(lodash.get(parameters, 'query.limit')) || 25;
    options.skip = parseInt(lodash.get(parameters, 'query.skip')) || 0;

    const userId = parameters.query.userId || this.userId;
    const user = Meteor.users.findOne(userId, { fields: { _id: 1, upperOf: 1, supporterOf: 1 } });
    const partupFields = { _id: 1, name: 1, image: 1, uppers: 1, slug: 1 };

    // find partups for user
    let partupsCursor;
    if (parameters.query.partupId) {
        partupsCursor = Partups.guardedFind(userId, { _id: { $in: [parameters.query.partupId] }}, { fields: partupFields });
    } else {
        partupsCursor = Partups.findPartupsIdsForUser(user, {
            upperOnly: (parameters.query.upperOnly === 'true') || false,
            supporterOnly: (parameters.query.supporterOnly === 'true') || false,
            fields: partupFields,
        }, userId);
    }

    // map ids for future finds
    const partupIds = partupsCursor.map(({_id}) => _id);
    const partupUpperArrays = partupsCursor.map(({uppers}) => uppers);
    const partupUpperIds = lodash.flattenDeep(partupUpperArrays);
    const partupUniqueUpperIds = lodash.uniq(partupUpperIds);

    // find all updates for user partups
    const updatesCursor = Updates.findForPartupsIds(partupIds, {
        filter: 'conversations',
        sort: { updated_at: -1 },
        fields: { comments: 0 },
        ...options,
    });

    const updateIds = updatesCursor.map(({_id}) => _id);
    const updateUserIds = updatesCursor.map(({upper_id}) => upper_id);
    // find all users for partups
    const userIds = Array.from(new Set([
        ...(partupUniqueUpperIds || []),
        ...(updateUserIds || []),
    ]));

    const usersCursor = Meteor.users.find({_id: {$in: userIds}}, {fields: {'_id': 1, 'name': 1, 'image': 1, 'profile.image': 1, 'profile.name': 1}});

    // find all activities for userPartupUpdates
    const activitiesCursor = Activities.findForUpdateIds(updateIds);
    const activityLaneIds = activitiesCursor.map(({lane_id}) => lane_id);

    // find lanes for activities
    const lanesCursor = Lanes.find({_id: {$in: activityLaneIds}});

    // find all asociated images for collections
    const imagesCursor = Images.findForCursors([{
        cursor: usersCursor,
        imageKey: 'profile.image',
    }, {
        cursor: partupsCursor,
        imageKey: 'image',
    }, {
        cursor: updatesCursor,
        imageKey: 'type_data.old_image',
    }, {
        cursor: updatesCursor,
        imageKey: 'type_data.new_image',
    }, {
        cursor: updatesCursor,
        imageKey: 'type_data.images',
    }]);

    // resolve data to client
    return {
        find: () => Meteor.users.find({_id: userId}),
        children: [
            {find: () => partupsCursor},
            {find: () => updatesCursor},
            {find: () => activitiesCursor},
            {find: () => lanesCursor},
            {find: () => usersCursor},
            {find: () => imagesCursor},
        ],
    };
});

/**
 * Publish multiple partups for discover
 *
 * @param {Object} parameters
 * @param {string} parameters.networkId
 * @param {string} parameters.locationId
 * @param {string} parameters.sort
 * @param {string} parameters.textSearch
 * @param {number} parameters.limit
 * @param {number} parameters.skip
 * @param {string} parameters.language
 */
Meteor.routeComposite('/partups/discover', function(request, parameters) {
    check(parameters.query, {
        networkId: Match.Optional(String),
        locationId: Match.Optional(String),
        sort: Match.Optional(String),
        textSearch: Match.Optional(String),
        limit: Match.Optional(String),
        skip: Match.Optional(String),
        language: Match.Optional(String),
        userId: Match.Optional(String)
    });

    parameters = {
        networkId: parameters.query.networkId,
        locationId: parameters.query.locationId,
        sort: parameters.query.sort,
        textSearch: parameters.query.textSearch,
        limit: parameters.query.limit,
        skip: parameters.query.skip,
        language: (parameters.query.language === 'all') ? undefined : parameters.query.language
    };

    var options = {};

    if (parameters.limit) options.limit = parseInt(parameters.limit);
    if (parameters.skip) options.skip = parseInt(parameters.skip);

    return {
        find: function() {
            return Partups.findForDiscover(this.userId, options, parameters);
        },
        children: [
            { find: Images.findForPartup },
            {
                find: Meteor.users.findUppersForPartup,
                children: [
                    { find: Images.findForUser }
                ]
            },
            {
                find: function(partup) {
                    return Networks.findForPartup(partup, this.userId);
                },
                children: [
                    { find: Images.findForNetwork }
                ]
            }
        ]
    };
});

Meteor.routeComposite('/partups/recommendations', function(request, parameters) {

    var userId = parameters.query.userId;
    var partupIds = [];
    var encryptedUpperId;

    /**
     * if we can run api locally we could let the api return local data
     * but for now we have to return dummy data to not break the recommendation flow
     */
    var dummyLocalData = {
        "partupIds": [
            "gJngF65ZWyS9f3NDE",
            "vGaxNojSerdizDPjb",
            "WxrpPuJkhafJB3gfF",
            "ASfRYBAzo2ayYk5si",
            "gJngF65ZWyS9f3NDE"
        ]
    };

    if (!Api.available) {
        console.log('WARNING: Api connection not available. For now returning dummy local recommendations');
        partupIds = dummyLocalData.partupIds;
    } else {
        var result = Api.get('/partups/recommended/for/user/' + userId);
        partupIds = result.data.partUpIds;
    }

    return {
        find: function() {
            return Partups.guardedFind(this.userId, { _id: { $in: partupIds } });
        },
        children: [
            { find: Images.findForPartup },
            {
                find: Meteor.users.findUppersForPartup,
                children: [
                    { find: Images.findForUser }
                ]
            },
            {
                find: function(partup) {
                    return Networks.findForPartup(partup, this.userId);
                },
                children: [
                    { find: Images.findForNetwork }
                ]
            }
        ]
    };

});


/**
 * Publish multiple partups by ids
 *
 * @param {[String]} partupIds
 */
Meteor.publishComposite('partups.by_ids', function(partupIds) {
    if (_.isString(partupIds)) partupIds = _.uniq(partupIds.split(','));

    check(partupIds, [String]);

    if (this.unblock) this.unblock();

    return {
        find: function() {
            return Partups.guardedFind(this.userId, { _id: { $in: partupIds } });
        },
        children: [
            { find: Images.findForPartup },
            {
                find: Meteor.users.findUppersForPartup,
                children: [
                    { find: Images.findForUser }
                ]
            },
            {
                find: function(partup) {
                    return Networks.findForPartup(partup, this.userId);
                },
                children: [
                    { find: Images.findForNetwork }
                ]
            }
        ]
    };
}, { url: 'partups/by_ids/:0' });

/**
 * Publish multiple partups by ids
 *
 * @param {[String]} networkSlug
 */
Meteor.publishComposite('partups.by_network_id', function(networkId, options) {
    check(networkId, String);

    var parameters = {};
    parameters.limit = options.limit || 10;

    if (this.unblock) this.unblock();

    return {
        find: function() {
            return Partups.guardedFind(this.userId, { network_id: networkId }, parameters);
        },
        children: [
            { find: Images.findForPartup },
            {
                find: Meteor.users.findUppersForPartup,
                children: [
                    { find: Images.findForUser }
                ]
            },
            {
                find: function(partup) {
                    return Networks.findForPartup(partup, this.userId);
                },
                children: [
                    { find: Images.findForNetwork }
                ]
            }
        ]
    };
});

/**
 * Publish a list of partups
 */
Meteor.publish('partups.list', function() {
    this.unblock();

    return Partups.guardedFind(this.userId, {}, { _id: 1, name: 1 });
});

/**
 * Publish partups for the homepage
 */
Meteor.publishComposite('partups.home', function(language) {
    if (this.unblock) this.unblock();

    return {
        find: function() {
            return Partups.findForDiscover(this.userId, { limit: 4 }, { sort: 'popular' });
        },
        children: [
            { find: Images.findForPartup },
            {
                find: Meteor.users.findUppersForPartup,
                children: [
                    { find: Images.findForUser }
                ]
            },
            {
                find: function(partup) {
                    return Networks.findForPartup(partup, this.userId);
                },
                children: [
                    { find: Images.findForNetwork }
                ]
            }
        ]
    };
}, { url: 'partups/home/:0' });

/**
 * Publish a single partup
 *
 * @param {String} partupId
 * @param {String} accessToken
 */
Meteor.publishComposite('partups.one', function(partupId, accessToken) {
    check(partupId, String);
    if (accessToken) check(accessToken, String);

    this.unblock();

    return {
        find: function() {
            return Partups.guardedMetaFind({ _id: partupId }, { limit: 1 });
        },
        children: [{
            find: function() {
                return Partups.guardedFind(this.userId, { _id: partupId }, { limit: 1 }, accessToken);
            },
            children: [
                { find: Images.findForPartup },
                {
                    find: function(partup) {
                        return Networks.findForPartup(partup, this.userId);
                    },
                    children: [
                        { find: Images.findForNetwork }
                    ]
                },
                {
                    find: Meteor.users.findUppersForPartup,
                    children: [
                        { find: Images.findForUser }
                    ]
                },
                {
                    find: Meteor.users.findSupportersForPartup,
                    children: [
                        { find: Images.findForUser }
                    ]
                }
            ]
        }]
    };
});
