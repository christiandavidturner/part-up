/**
 * Publish all activities in a partup
 *
 *
 * @param {String} partupId
 * @param {String} accessToken
 */
Meteor.publishComposite('activities.from_partup', function(partupId, accessToken) {
    check(partupId, String);
    if (accessToken) check(accessToken, String);

    this.unblock();

    const self = this;
    Slogger.write({
      action: 'activities.from_partup',
      type: 'composite publication',
      data: {
        self,
      },
    });

    return {
        find: function() {
            var partup = Partups.guardedFind(this.userId, {_id: partupId}, {limit: 1}, accessToken).fetch().pop();
            if (!partup) return;

            return Activities.findForPartup(partup);
        },
        children: [
            {find: Updates.findForActivity},
            {find: Contributions.findForActivity, children: [
                {
                    find: Meteor.users.findForContribution, children: [
                        {find: Images.findForUser}
                    ]
                },
                {find: Ratings.findForContribution, children: [
                    {find: Meteor.users.findForRating, children: [
                        {find: Images.findForUser}
                    ]},
                ]}
            ]},
            { find: Images.findForActivity },
            { find: Files.findForActivity },

        ]
    };
});

/**
 * Publish all activities in a partup
 *
 *
 * @param {String} partupId
 * @param {String} accessToken
 */
Meteor.routeComposite('/activities/me', function(request, parameters) {
  Slogger.write({
    action: 'activities/me',
    type: 'composite route',
    data: {
      // request,
      parameters,
    },
  });

    const userId = parameters.query.userId || this.userId;
    const archived = parameters.query && parameters.query.filterByArchived === 'true';
    const user = Meteor.users.findOne(userId, { fields: { _id: 1, upperOf: 1 } });

    const options = {};
    options.limit = parseInt(lodash.get(parameters, 'query.limit')) || 25;
    options.skip = parseInt(lodash.get(parameters, 'query.skip')) || 0;

    const partupsCursor = Partups.find({
        _id: { $in: user.upperOf },
        archived_at: null,
    }, {
        fields: { _id: 1, name: 1, image: 1, uppers: 1, slug: 1 },
    });
    const partupIds = partupsCursor.map(({_id}) => _id);

    // Get contributions that
    const userContributionCursor = Contributions.find({
        partup_id: { $in: partupIds },
        upper_id: userId,
    });

    const activityIds = [...new Set(userContributionCursor.map(({ activity_id }) => activity_id))];

    const activityCursor = Activities.findForActivityIds(activityIds, options, { archived });

    const contributionCursor = Contributions.find({
        activity_id: { $in: activityIds },
    });

    const userIds = contributionCursor.map(({ upper_id }) => upper_id);
    const usersCursor = Meteor.users.find(
        { _id: { $in: userIds } },
        { fields: { '_id': 1, 'profile.name': 1, 'profile.image': 1 }},
    );

    const imagesCursor = Images.findForCursors([{
        cursor: usersCursor,
        imageKey: 'profile.image',
    }]);

    return {
        find: () => Meteor.users.find({_id: userId}),
        children: [
            {find: () => partupsCursor},
            {find: () => ({
                fetch: () => activityCursor,
                _cursorDescription: { collectionName: 'activities' },
            })},
            {find: () => contributionCursor},
            {find: () => usersCursor},
            {find: () => imagesCursor},
        ],
    };
});


Meteor.publishComposite('activities.updated_activities', function() {
    const user = Meteor.user();

    const self = this;
    Slogger.write({
      action: 'activities.updated_activities',
      type: 'composite publication',
      data: {
        self
      },
    });

    const selector = {
        upper_data: {
            $elemMatch: {
                _id: user._id,
                new_updates: { $exists: true, $not: {$size: 0} },
            },
        },
    };

    const partupsWithUpdatesForUser = Partups.find(selector, { fields: { _id: 1, upper_data: 1 } });

    return {
        find: () => partupsWithUpdatesForUser,
        children: [
            {find: ({upper_data}) => Updates.find({
                _id: { $in: upper_data.find(({_id}) => _id === user._id).new_updates || [] },
                type: 'partups_contributions_added',
            }, {
                fields: {
                    _id: 1,
                    type: 1,
                },
            })},
        ],
    };
});
