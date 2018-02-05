import { _ } from 'lodash';

/**
 * Publish a user
 *
 * @param {String} userId
 */
Meteor.publishComposite('users.one', function (userId) {
  check(userId, String);

  const self = this;
    Slogger.write({
      action: 'users.one',
      type: 'composite publication',
      data: {
        self,
      }
    });

	this.unblock();

	return {
		find: function () {
			return Meteor.users.findSinglePublicProfile(userId);
		},
		children: [
			{ find: Images.findForUser }
		]
	};
});

// We require the ID because we do not have access to this ID outside the return {} block (cursor);
Meteor.routeComposite('/users/:id/menu', function (request, params) {
  check(params.id, String);

    Slogger.write({
      action: 'users/:id/menu',
      type: 'composite route',
      data: {
        // request,
        params
      }
    });

	const options = parseDefaultOptions(params.query);
	const user = Meteor.users.findOne(params.id, { fields: { _id: 1, upperOf: 1, supporterOf: 1, networks: 1 } });

    const partupsToGet = _.uniq(_.concat(user.upperOf, user.supporterOf));
	const partupCursor = Partups.findForMenu(user._id, partupsToGet, options);

	const partupNetworks = _.uniq(partupCursor.map(p => p.network_id));
	const networksToGet = _.union(user.networks, partupNetworks);
	const networkCursor = Networks.findForMenu(user._id, networksToGet, options);

	return {
		find() {
			return Meteor.users.find(this.userId, { fields: { _id: 1, upperOf: 1, supporterOf: 1 } });
		},
		children: [
			{
				find(user) {
					return partupCursor;
				}
			},
			{
				find(user) {
					return networkCursor;
				}
			},
			{
				find(user) {
					const imageIds = _.union(partupCursor.map(p => p.image), networkCursor.map(n => n.image));
					return Images.find({ _id: { $in: imageIds } }, { fields: { 'copies.80x80': 1 } });
				}
			}
		]
	}
});


// OBSOLETE
// Used to load individual part-ups by id's
Meteor.routeComposite('/users/me/menu/partups', function (request, params) {

  const options = parseDefaultOptions(params.query);

  Slogger.write({
    action: 'users/me/menu/partups',
    type: 'composite route',
    data: {
      // request,
      params
    }
  });

	return {
		find: function () {
			const user = Meteor.users.findOne(this.userId, { fields: { _id: 1, upperOf: 1, supporterOf: 1 } });

            // Check if there are any Id's sent with the request and use those to query the database
            // If no Id's given in the request get all the partup id's from the user object
			const partupsToGet = options.partupIds ?
				JSON.parse(options.partupIds) :
				user.upperOf ?
					user.upperOf.concat(user.supporterOf || []) :
					user.supporterOf || [];

			options.fields = {
				name: 1,
				network_id: 1,
				slug: 1,
				image: 1,
				upper_data: { $elemMatch: { _id: this.userId } }
			};

			return Partups.guardedFind(this.userId, { $and: [{ _id: { $in: partupsToGet } }, { archived_at: { $exists: false } }] }, options);
		},
		children: [
			{
                find(partup) {
                    return Images.find({ _id: partup.image }, { fields: { 'copies.80x80': 1 } });
                }
            }
		]
	};
});

// OBSOLETE
// Used to load individual networks by id's
Meteor.routeComposite('/users/me/menu/networks', function (request, params) {

    Slogger.write({
      action: 'users/me/menu/networks',
      type: 'composite route',
      data: {
        // request,
        params,
      }
    });

	const options = parseDefaultOptions(params.query);
	options.fields = {
		_id: 1,
		name: 1,
		slug: 1,
		image: 1,
	};

	return {
		find: function () {
			const user = Meteor.users.findOne(this.userId, { fields: { networks: 1 } });
			const networksToGet = options.networkIds ?
				JSON.parse(options.networkIds) :
				user.networks || [];
			return Networks.guardedFind(user._id, { $and: [{ _id: { $in: networksToGet } }, { archived_at: { $exists: false } }] }, options);
		},
		children: [
			{
                find(network) {
                    return Images.find({ _id: network.image }, { fields: { 'copies.80x80': 1 } });
                }
            }
		]
	};
});

/**
 * Publish all partups a user is upper in
 *
 * @param {Object} request
 * @param {Object} params
 */
Meteor.routeComposite('/users/:id/upperpartups', function (request, params) {
	var options = {};
	var skip = 0;
  var limit = 100;


    Slogger.write({
      action: 'users/:id/upperpartups',
      type: 'composite route',
      data: {
        // request,
        params
      }
    });

	if (request.query) {
		if (request.query.limit) limit = parseInt(request.query.limit);
		if (request.query.skip) skip = parseInt(request.query.skip);
		if (request.query.archived) options.archived = JSON.parse(request.query.archived);
	}

	return {
		find: function () {
			var user = Meteor.users.findOne(params.id);
			if (!user) return;

			const getUpdatesCountForUser = function (partup) {
				const upperData = partup.upper_data.find(function (ud) { return ud._id === user._id; });
				return upperData ? upperData.new_updates.length : 0;
			};

			var result = Partups.findUpperPartupsForUser(user, options, this.userId)
				.fetch()
				.sort(function (a, b) {
					return getUpdatesCountForUser(b) - getUpdatesCountForUser(a);
				})
				.slice(skip, skip + limit);

			// Fake cursor for routeComposite
			return {
				fetch: function () {
					return result;
				},
				_cursorDescription: {
					collectionName: 'partups'
				}
			};
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
				find: function (partup) { return Networks.findForPartup(partup, this.userId); },
				children: [
					{ find: Images.findForNetwork }
				]
			}
		]
	};
});

/**
 * Publish all partups a user is supporter of
 *
 * @param {Object} request
 * @param {Object} params
 */
Meteor.routeComposite('/users/:id/supporterpartups', function (request, params) {
	var options = {};
	var skip = 0;
  var limit = 100;

    Slogger.write({
      action: 'users/:id/supporterpartups',
      type: 'composite route',
      data: {
        // request,
        params
      }
    });

	if (request.query) {
		if (request.query.limit) limit = parseInt(request.query.limit);
		if (request.query.skip) skip = parseInt(request.query.skip);
		if (request.query.archived) options.archived = JSON.parse(request.query.archived);
	}

	return {
		find: function () {
			var user = Meteor.users.findOne(params.id);
			if (!user) return;

			const getUpdatesCountForUser = function (partup) {
				const upperData = partup.upper_data.find(function (ud) { return ud._id === user._id; });
				return upperData ? upperData.new_updates.length : 0;
			};

			var result = Partups.findSupporterPartupsForUser(user, options, this.userId)
				.fetch()
				.sort(function (a, b) {
					return getUpdatesCountForUser(b) - getUpdatesCountForUser(a);
				})
				.slice(skip, skip + limit);

			// Fake cursor for routeComposite
			return {
				fetch: function () {
					return result;
				},
				_cursorDescription: {
					collectionName: 'partups'
				}
			};
		},
		children: [
			{ find: Images.findForPartup },
			{
				find: Meteor.users.findUppersForPartup,
				children: [
					{ find: Images.findForUser }
				]
			},
			{ find: Meteor.users.findSupportersForPartup },
			{
				find: function (partup) { return Networks.findForPartup(partup, this.userId); },
				children: [
					{ find: Images.findForNetwork }
				]
			}
		]
	};
});



/**
 * Publish all networks a user is in
 *
 * @param {Object} request
 * @param {Object} params
 */
Meteor.routeComposite('/users/:id/networks', function (request, params) {
	var options = {
		sort: {
			name: 1
		}
  };

    Slogger.write({
      action: 'users/:id/networks',
      type: 'composite route',
      data: {
        // request,
        params
      }
    });

	if (request.query) {
		if (request.query.limit) options.limit = parseInt(request.query.limit);
		if (request.query.skip) options.skip = parseInt(request.query.skip);
	}

	return {
		find: function () {
			return Meteor.users.find(params.id, { fields: { networks: 1 } });
		},
		children: [{
			find: function (user) {
				return Networks.findUnarchivedForUser(user, this.userId, options);
			},
			children: [
				{ find: Images.findForNetwork }
			]
		}]
	};

});

/**
 * Publish all partners a user worked with
 *
 * @param {Object} request
 * @param {Object} params
 */
Meteor.routeComposite('/users/:id/partners', function (request, params) {
  var options = {};

  Slogger.write({
    action: 'users/id/partners',
    type: 'composite route',
    data: {
      // request,
      params
    }
  });
	if (request.query) {
		if (request.query.limit) options.limit = parseInt(request.query.limit);
		if (request.query.skip) options.skip = parseInt(request.query.skip);
	}

	return {
		find: function () {
			var user = Meteor.users.findOne({ _id: params.id });
			return Meteor.users.findPartnersForUpper(user, options, { sortByPartnerFrequency: true });
		},
		children: [{ find: Images.findForUser }]
	};
});

/**
 * Publish the loggedin user
 */
Meteor.publishComposite('users.loggedin', function () {

  const self = this;
    Slogger.write({
      action: 'users.loggedin',
      type: 'composite publication',
      data: {
        self,
      }
    });


	return {
		find: function () {
			if (this.userId) {
				return Meteor.users.findSinglePrivateProfile(this.userId);
			} else {
				this.ready();
			}
		},
		children: [
			{ find: Images.findForUser }
		]
	};
});

/**
 * Publish multiple users by ids
 *
 * @param {[String]} userIds
 */
Meteor.publishComposite('users.by_ids', function (userIds) {
	check(userIds, [String]);

  this.unblock();

  const self = this;
    Slogger.write({
      action: 'users.by_ids',
      type: 'composite publication',
      data: {
        self,
      }
    });

	return {
		find: function () {
			return Meteor.users.findMultiplePublicProfiles(userIds);
		},
		children: [
			{ find: Images.findForUser },
			{ find: Invites.findForUser }
		]
	};
});

Meteor.publishComposite('users.by_ids.for_online_status', function(userIds) {
    check(userIds, [String]);

    const self = this;
    Slogger.write({
      action: 'users.by_ids.for_online_status',
      type: 'composite publication',
      data: {
        self,
      }
    });

    this.unblock();

    return {
        find: function() {
            return Meteor.users.find({_id: {$in: userIds}}, {fields: { status: 1 }});
        },
    };
});

/**
 * Publish public network admin profiles by network slug
 *
 * @param {String} networkSlug
 */
Meteor.publishComposite('admins.by_network_slug', function (networkSlug) {
  check(networkSlug, String);

  const self = this;
    Slogger.write({
      action: 'admins.by_network_slug',
      type: 'composite publication',
      data: {
        self,
      }
    });

	this.unblock();

	var network = Networks.findOne({ slug: networkSlug });

	return {
		find: function () {
			return Meteor.users.findMultipleNetworkAdminProfiles(network.admins);
		},
		children: [
			{ find: Images.findForUser }
		]
	};
});

function parseDefaultOptions(options) {
	if (!options) return {};

	if (options.limit) options.limit = parseInt(options.limit);
	if (options.skip) options.skip = parseInt(options.skip);
	if (options.archived) options.archived = JSON.parse(options.archived);

	return options;
}