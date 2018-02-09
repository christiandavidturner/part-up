import { get } from 'lodash';

Template.app_partup.onCreated(function() {
    const template = this;

    template.network = new ReactiveVar(undefined);
    template.partup = new ReactiveVar(undefined, (oldVal, newVal) => {
        template.network.set(
            newVal ? Networks.findOne(newVal.network_id) : undefined
        );
        if (newVal) {
            // this throws an error on chrome about a subscription
            // It's very important to keep this in order for the updates to keep working
            if (typeof newVal._id === 'string') {
                Partup.client.updates.firstUnseenUpdate(newVal._id).set();
            }
        }
        template.loading.partup.set(false);
    });

    template.loading = {
        partup: new ReactiveVar(true),
        board: new ReactiveVar(true),
        activities: new ReactiveVar(true),
    };

    const sidebarCookie = Cookies.get('partup_sidebar_expanded');
    const sidebarState =
        sidebarCookie !== undefined
            ? sidebarCookie.toBool()
            : !Partup.client.isMobile.isTabletOrMobile();

    template.sidebarExpanded = new ReactiveVar(
        sidebarState,
        (oldVal, newVal) => {
            Cookies.set('partup_sidebar_expanded', newVal, {
                expires: Infinity,
            });
        }
    );

    window.addEventListener('orientationchange', () => {
        if (screen.width < screen.height) {
            template.sidebarExpanded.set(false);
        } else {
            template.sidebarExpanded.set(true);
        }
    });

    template.autorun(() => {
        const partupId = Template.currentData().partupId;
        const accessToken = Session.get('partup_access_token');

        if (typeof partupId !== 'string') {
            return Router.pageNotFound('partup');
        }

        Meteor.subscribe('partups.one', partupId, accessToken, {
            onReady() {
                const partup = Partups.findOne(partupId);
                if (partup) {
                    if (
                        !partup.isViewableByUser(
                            Meteor.userId(),
                            Session.get('partup_access_token')
                        )
                    ) {
                        return Router.pageNotFound('partup-closed');
                    }
                    return template.partup.set(partup);
                }

                return Router.pageNotFound('partup');
            },
        });

        subManager.updates.subscribe('updates.from_partup', partupId, {}, accessToken);

        const boardSubHandle = subManager.boards.subscribe('board.for_partup_id', partupId, accessToken);
        if (boardSubHandle.ready()) {
          this.loading.board.set(false);
        }
        const activitySubHandle = subManager.activities.subscribe('activities.from_partup', partupId, accessToken);
        if (activitySubHandle.ready()) {
          this.loading.activities.set(false);
        }
    });
});

Template.app_partup.helpers({
    network() {
        return Template.instance().network.get();
    },
    partup() {
        return Template.instance().partup.get();
    },
    partupLoaded() {
        const { loading, partup } = Template.instance();

        if (
            ActiveRoute.name(/partup-activities/) &&
            get(partup.get(), 'board_view', false)
        ) {
            return (
                !loading.partup.get() &&
                !loading.board.get() &&
                !loading.activities.get()
            );
        }

        return !loading.partup.get();
    },
    sidebarExpanded() {
        return Template.instance().sidebarExpanded.get();
    },
    scrollHorizontal() {
        return (
            Router.current().route.getName() === 'partup-activities' &&
            (Template.instance().partup.get() &&
                Template.instance().partup.get().board_view)
        );
    },
    partupStartClassName() {
        return (
            Router.current().route.getName() === 'partup-start' &&
            'pu-partup-start'
        );
    },
});

Template.app_partup.events({
    'click [data-toggle-sidebar]': (event, templateInstance) => {
        event.preventDefault();
        templateInstance.sidebarExpanded.set(
            !templateInstance.sidebarExpanded.curValue
        );
    },
});
