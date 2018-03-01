import { get, isString } from 'lodash';

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
        rest: new ReactiveVar(true),
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

  this.handleOrientationchange = () => {
    if (screen.width < screen.height) {
      this.sidebarExpanded.set(false);
    } else {
      this.sidebarExpanded.set(true);
    }
  };
  window.addEventListener('orientationchange', this.handleOrientationchange, { passive: true });

  this.autorun(() => {
    const partupId = Template.currentData().partupId;
    const accessToken = Session.get('partup_access_token');

    if (!isString(partupId)) {
      return Router.pageNotFound('partup');
    }
    this.partupSub = subManager.partups.subscribe('partups.one', partupId, accessToken);
    this.boardSub = subManager.boards.subscribe('board.for_partup_id', partupId);

    if (this.partupSub.ready()) {
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
        template.partup.set(partup);
      } else {
        Router.pageNotFound('partup');
      }
    }
    if (this.boardSub.ready()) {
      this.loading.rest.set(false);
    }
  });
});

Template.app_partup.onDestroyed(function() {
  const self = this;
  window.removeEventListener('orientationchange', self.handleOrientationchange);
})

Template.app_partup.helpers({
    network() {
        return Template.instance().network.get();
    },
    partup() {
        return Template.instance().partup.get();
    },
    partupLoaded() {
        const { loading, partup } = Template.instance();
        return !loading.partup.get() && !loading.rest.get();
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
