/**
 * Publish a list of swarms
 */
Meteor.publishComposite('swarms.list', function() {
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'swarms.list',
      type: 'composite publication',
      data: {
        self,
      }
    });

    return {
        find: function() {
            return Swarms.guardedFind(this.userId);
        },
        children: [
            {find: Images.findForSwarm}
        ]
    };
});

/**
 * Publish a swarm
 *
 * @param {String} swarmSlug
 */
Meteor.publishComposite('swarms.one', function(swarmSlug) {
    check(swarmSlug, String);

    const self = this;
    Slogger.write({
      action: 'swarms.one',
      type: 'composite publication',
      data: {
        self,
      }
    });

    if (this.unblock) this.unblock();

    return {
        find: function() {
            return Swarms.guardedMetaFind({slug: swarmSlug}, {limit: 1});
        },
        children: [
            {
                find: function(swarm) {
                    if (swarm.quotes.length > 0) {
                        var userIds = mout.array.map(swarm.quotes, function(quote) {
                            return quote.author._id;
                        });
                        return Meteor.users.findMultiplePublicProfiles(userIds);
                    }
                }, children: [
                    {find: Images.findForUser}
                ]
            },
            {find: Images.findForSwarm},
            {
                find: function() {
                    return Swarms.guardedFind(this.userId, {slug: swarmSlug}, {limit: 1});
                }
            }
        ]
    };
});

/**
 * Publish all tribes in a swarm
 *
 * @param {Object} urlParams
 * @param {Object} parameters
 */
Meteor.publishComposite('swarms.one.networks', function(swarmSlug, parameters) {
    check(swarmSlug, String);

    if (this.unblock) this.unblock();

    const self = this;
    Slogger.write({
      action: 'swams.one.networks',
      type: 'composite publication',
      data: {
        self,
        parameters
      }
    });

    return {
        find: function() {
            return Swarms.guardedMetaFind({slug: swarmSlug}, {limit: 1});
        },
        children: [
            {find: function(swarm) {
                return Networks.guardedMetaFind({_id: {$in: swarm.networks}}, {limit: 25});
            }, children: [
                {find: Images.findForNetwork}
            ]}
        ]
    };
});

/**
 * Publish all swarms for admin panel
 */
Meteor.publishComposite('swarms.admin_all', function() {
    this.unblock();

    const self = this;
    Slogger.write({
      action: 'swarms.admin_all',
      type: 'composite publication',
      data: {
        self,
      }
    });

    var user = Meteor.users.findOne(this.userId);
    if (!User(user).isAdmin()) return;

    return {
        find: function() {
            return Swarms.find({});
        },
        children: [
            {find: Images.findForSwarm},
            {find: function(swarm) {
                return Meteor.users.findSinglePublicProfile(swarm.admin_id);
            }, children: [
                {find: Images.findForUser}
            ]}
        ]
    };
});
