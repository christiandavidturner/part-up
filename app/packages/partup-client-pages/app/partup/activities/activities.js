import { assign, get, isString, isFunction, noop } from 'lodash';

const activityFilters = {
  default: 'default',
  my: 'my-activities',
  open: 'open-activities',
};

const openPopup = (laneId, callback) => {
  Partup.client.popup.open({
    id: 'new-activity',
    parameters: {
      laneId,
    }
  }, callback);
};
const createActivity = (laneId, callback) => {
  if (Meteor.userId()) {
    openPopup(laneId, callback);
  } else {
    Intent.go({ route: 'login' }, (user) => {
      if (user) {
        openPopup(laneId, callback);
      }
    });
  }
};

const findActivities = (partupId, filter, options = {}) => {
  const selector = assign({
    partup_id: partupId,
    archived: { $ne: true }
  }, options);

  if (filter === activityFilters.my) {
    selector.creator_id = Meteor.userId();
  }

  return Activities.find(selector).fetch()
    .filter((activity) => {
      if (filter === activityFilters.open) {
        return Contributions.find({ activity_id: activity._id }).count() === 0;
      }
      return true;
    })
    .sort(Partup.client.sort.dateASC.bind(null, 'created_at'))
    .sort(Partup.client.sort.dateASC.bind(null, 'end_date'));
}

Template.app_partup_activities.onCreated(function() {
  const template = this;
  const partup = Partups.findOne(this.data.partupId);

  this.loading = new ReactiveVar(false);
  this.filter = new ReactiveVar(activityFilters.default);
});

Template.app_partup_activities.helpers({
  activities() {
    const activeFilter = Template.instance().filter.get();
    return findActivities(this.partupId, activeFilter);
  },
  archivedActivities: function() {
    const activeFilter = Template.instance().filter.get();
    return findActivities(this.partupId, activeFilter, { archived: true });
  },
  isUpper() {
    return User(Meteor.user()).isPartnerInPartup(this.partupId);
  },
  filter() {
    return Template.instance().filter;
  },
  loading() {
    return Template.instance().loading.get();
  },
  boardview() {
    const partup = Partups.findOne(this.partupId);
    return partup ? partup.board_view : false;
  },
  onAddHook: function() {
    return createActivity;
  }
});

Template.app_partup_activities.events({
    'click [data-new-activity]': function(event, template) {
        event.preventDefault();

        createActivity(null, (id) => {
          if (isString(id)) {
            const board = Boards.findOne({ partup_id: template.data.partupId });
            if (board && board.lanes) {
              const firstlane = board.lanes[0];
              const $lane = $(`[data-sortable-lane=${firstlane}]`);
              if ($lane) {
                setTimeout(() => {
                  $lane.animate({ scrollTop: $lane[0].scrollHeight }, '300');
                }, 250);
              }
            }
          }
        });
    },
});
