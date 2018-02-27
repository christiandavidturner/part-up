Template.app_network.onCreated(function() {
    var template = this
    var networkSlug = template.data.networkSlug;

    template.networkSlug = new ReactiveVar(networkSlug)
    template.networkLoaded = new ReactiveVar(false);

    if (!networkSlug) {
      return;
    }

    template.networkSubscription = template.subscribe('networks.one', networkSlug, {
        onReady: function () {
            if (!Networks.findOne({slug: networkSlug})) {
                Router.pageNotFound('network')
                template.networkLoaded.set(true)
            }
        }
    })
})

/*************************************************************/
/* Page helpers */
/*************************************************************/
Template.app_network.helpers({
    data: function() {
        var template = Template.instance();

        var networkSlug = template.networkSlug.get();
        if (!networkSlug) return false;

        var network = Networks.findOne({slug: networkSlug});
        if (!network) return false;

        Partup.client.windowTitle.setContextName(network.name);

        return {
            network: function() {
                return network;
            },
            unreadChatMessages: function() {
                if (!network.chat_id) return false;
                var chat = Chats.findOne({_id: network.chat_id});
                if (!chat) return false;
                return chat.hasUnreadMessages();
            },
            isInvitePending: function() {
                var user = Meteor.user();
                if (!user || !user.pending_networks) return false;
                return mout.array.contains(user.pending_networks, network._id);
            },
            accessToken: function() {
                return data.accessToken;
            },
            networkSlug: function() {
                return template.networkSlug.get();
            },
            selectorSettings: function() {
                if (!network) return false;

                return {
                    slug: network.slug,
                    currentRoute: Router.current().route.getName(),
                    network: network
                };
            },
        };
    },

    state: function() {
        var template = Template.instance();
        return {
            shrinkHeader: function() {
                return Partup.client.scroll.pos.get() > 100;
            },
            currentPageIsChat: function() {
                return Router.current().route.getName() === 'network-chat';
            }
        };
    }
});

// This is copied from the 'joinbutton' template.
// TODO: maybe move this functionality to the network collection?
var leaveNetwork = function(template, network) {
    Meteor.call('networks.leave', network._id, function(error) {
        if (error) {
            Partup.client.notify.error(error.reason);
            return;
        }
        Partup.client.notify.success(TAPi18n.__('pages-app-network-notification-left'));

        Subs.reset();
        if (network.isClosedForUpper(Meteor.user())) {
            Router.go('discover');
        }
        analytics.track('left network', {
            networkId: network._id
        });
    });
};


/*************************************************************/
/* Page events */
/*************************************************************/
Template.app_network.events({
    'click [data-open-networksettings]': function(event, template) {
        event.preventDefault();
        var networkSlug = template.networkSlug.get();
        Intent.go({
            route: 'network-settings',
            params: {
                slug: networkSlug
            }
        });
    },
    'click [data-location]': function(event, template) {
        event.preventDefault();
        var networkSlug = template.networkSlug.get();
        var location = Networks.findOne({slug: networkSlug}).location;
        Partup.client.discover.setPrefill('locationId', location.place_id);
        Partup.client.discover.setCustomPrefill('locationLabel', location.city);
        Router.go('discover');
    },
    'click [data-blank]': function(event, template) {
        event.preventDefault();
    },
    'click [data-header-navigate]': function(event, template) {
        Router.go('network', {slug: template.networkSlug.get()}, {query: 'show=true'})
    },
    'click [data-leave-tribe]': function(event, template) {
        event.preventDefault();
        var network = Networks.findOne({slug: template.networkSlug.get()});
        Partup.client.prompt.confirm({
            title: TAPi18n.__('pages-app-network-confirmation-title', {
                tribe: network.name
            }),
            message: TAPi18n.__('pages-app-network-confirmation-message'),
            confirmButton: TAPi18n.__('pages-app-network-confirmation-confirm-button'),
            cancelButton: TAPi18n.__('pages-app-network-confirmation-cancel-button'),
            onConfirm: function() {
                leaveNetwork(template, network);
            }
        });
    }
});
