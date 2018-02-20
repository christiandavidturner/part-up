Template.modal_invite_to_activity.onCreated(function () {
    var template = this;
    var user = Meteor.user();
    var userId = Meteor.userId();
    var partupId = template.data.partupId;
    var activityId = template.data.activityId;
    var PAGING_INCREMENT = 10;

    template.activeTab = new ReactiveVar(1);
    template.loading = new ReactiveVar(true);

    template.userIds = new ReactiveVar([]);
    template.networks = new ReactiveVar([]);
    template.selectedNetwork = new ReactiveVar('all', resetPage);
    template.networksLoaded = false;
    template.page = new ReactiveVar(false, loadSuggestedUsersToPage);

    template.states = {
        loading_infinite_scroll: false,
        paging_end_reached: new ReactiveVar(false)
    };
    template.query = {
        currentQuery: '',
        searchQuery: new ReactiveVar(undefined, function(curQuery, newQuery) {
            currentQuery = newQuery;
            resetPage(curQuery, newQuery);
        })
    };

    // Asign functions to the template so they can be accessed by the helpers & event handlers.
    template.resetPage = resetPage;
    template.submitFilterForm = submitFilterForm;

    template.partupSubscription = template.subscribe('partups.one', partupId, preselectNetwork);
    template.activitiesSubscription = template.subscribe('activities.partup_create', partupId);
    template.invitesSubsciption = template.subscribe('invites.for_activity_id', activityId);

    /* Initializing the template */
    // Set networks for filtering users.
    setNetworks();
    // This will trigger a change in the ReactiveVar which in turn will run the assigned function and load the user tiles.
    // See 'loadSuggestedUsersToPage' below.
    template.page.set(0);

    function resetPage() {
            template.userIds.set([]);
            template.states.paging_end_reached.set(false);
            template.states.loading_infinite_scroll = false;
            _.defer(function() {template.page.set(0)});
    };
    function submitFilterForm() {
        Meteor.defer(function () {
            var form = template.find('form#suggestionsQuery');
            $(form).submit();
        });
    };

    // Sets the network from the part-up that's navigated from
    function preselectNetwork() {
        var partup = Partups.findOne(partupId);
        if (!partup) return;
        var networks = template.networks.get();
        if (!networks || !networks.length) return;
        var network = lodash.find(networks, {_id: partup.network_id || undefined});
        template.selectedNetwork.set(network ? network.slug : 'all');
    };
    // Fill the list of networks
    function setNetworks() {
        var query = {
            token: Accounts._storedLoginToken(),
            archived: false
        };
        HTTP.get('/users/' + userId + '/networks' + mout.queryString.encode(query), function (error, response) {
            template.networksLoaded = true;
            if (error || !response.data.networks || response.data.networks.length === 0) return;

            var result = response.data;

            template.networks.set(result.networks.map(function (network) {
                Partup.client.embed.network(network, result['cfs.images.filerecord'], result.users);
                return network;
            }).sort(Partup.client.sort.alphabeticallyASC.bind(null, 'name')));

            preselectNetwork();
        });
    };
    function loadSuggestedUsersToPage(prevPage, page) {
        template.loading.set(true);
        var currentTab = template.activeTab.get();

        // Tab 1, get the suggestions filtered by name and tribe.
        if (currentTab === 1) {
            var query = template.query.searchQuery.get() || '';
            var options = {
                query: query,
                limit: PAGING_INCREMENT,
                skip: page * PAGING_INCREMENT,
                network: template.selectedNetwork.curValue === 'all' ? undefined : template.selectedNetwork.curValue
            };
            Meteor.call('activities.user_suggestions', activityId, options, function(error, userIds) {
                if (error) {
                    return Partup.client.notify.error(TAPi18n.__('base-errors' + error.reason));
                }
                if (!userIds || userIds.length === 0) {
                    template.states.loading_infinite_scroll = false;
                    template.states.paging_end_reached.set(true);
                    return;
                }
                template.states.paging_end_reached.set(userIds < PAGING_INCREMENT);
                setUsers(userIds);
            });
        }
        // Tab 3, get a list of users already invited.
        else if (currentTab === 3) {
            var ids = Invites.find().fetch()
                .filter(invite => invite.invitee_id)
                .map(invite => invite.invitee_id);

            template.states.paging_end_reached.set(ids < PAGING_INCREMENT);
            setUsers(ids);
        }
        template.loading.set(false);
        template.states.loading_infinite_scroll = false;
    };

    // This method will be called multiple times (race condition).
    // _.difference() is used to prevent duplicate userIds.
    function setUsers(userIds) {
        var filterSelf = _.without(userIds, user._id);
        var existingUserIds = template.userIds.get();
        var filtered = existingUserIds.length > 0 ? _.difference(filterSelf, existingUserIds) : filterSelf;
        var newUserIds = existingUserIds.concat(filtered);
        template.userIds.set(newUserIds);
    };
});

Template.modal_invite_to_activity.onRendered(function () {
    var template = this;
    Partup.client.scroll.infinite({
        template: template,
        element: template.find('[data-infinitescroll-container]'),
        offset: 800
    }, function() {
        if (!(template.networksLoaded && template.partupSubscription.ready())) return;
        if (template.states.loading_infinite_scroll || template.states.paging_end_reached.curValue) { return; }
        template.page.set(template.page.curValue + 1);
    });
})

Template.modal_invite_to_activity.helpers({
    data: function () {
        var template = Template.instance();
        return {
            partupId: function () {
                return template.data.partupId;
            },
            activityId: function () {
                return template.data.activityId;
            },
            suggestionIds: function () {
                return template.userIds.get();
            },
            textsearch: function () {
                return template.query.searchQuery.get() || '';
            },
            userTribes: function () {
                return template.networks.get();
            },
            partup: function () {
                return Partups.findOne(template.data.partupId);
            }
        };
    },
    state: function () {
        var template = Template.instance();
        return {
            loading: function () {
                return template.loading.get();
            }
        };
    },
    onToggleTab: function () {
        var template = Template.instance();
        return function (newActiveTab) {
            template.resetPage(); // Reset all the variables used to represent the state of the page and user tiles before switching tabs.
            template.activeTab.set(newActiveTab);
            template.query.searchQuery.set(undefined);
        }
    }
});

/*************************************************************/
/* Page events */
/*************************************************************/
Template.modal_invite_to_activity.events({
    'click [data-closepage]': function (event, template) {
        event.preventDefault();
        var partupId = template.data.partupId;
        var partup = Partups.findOne({ _id: partupId });

        Intent.return('partup-activity-invite', {
            fallback_route: {
                name: 'partup',
                params: {
                    slug: partup.slug
                }
            }
        });
    },
    'change [data-filter-tribe]': function (event, template) {
        template.selectedNetwork.set(event.currentTarget.value);
        template.submitFilterForm();
    },
    'submit form#suggestionsQuery': function (event, template) {
        event.preventDefault();
        var form = event.currentTarget;
        template.query.searchQuery.set(form.elements.search_query.value);
    },
    'click [data-reset-search-query-input]': function (event, template) {
        event.preventDefault();
        $('[data-search-query-input]').val('');
        template.submitFilterForm();
    },
    'keyup [data-search-query-input]': function (e, template) {
        template.submitFilterForm();
    }
});
