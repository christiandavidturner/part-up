Template.app_partup_activities.onCreated(function() {
    var template = this;
    template.partup = Partups.findOne(template.data.partupId);

    template.activities = {

        // States
        loading: new ReactiveVar(false),

        // Filter
        filter: new ReactiveVar('default'),

        // All activities
        all: function(options) {
            var options = options || {};

            var filter = template.activities.filter.get();

            var activities = Activities
                .findForPartup(template.partup, {}, {archived: !!options.archived})
                .fetch()
            .filter(function(activity, idx) {
                    if (filter === 'my-activities')
                        return activity.creator_id && activity.creator_id === Meteor.user()._id;

                    if (filter === 'open-activities')
                        return Contributions.findForActivity(activity).count() === 0;

                    return true;
                })
                .sort(Partup.client.sort.dateASC.bind(null, 'created_at'))
                .sort(Partup.client.sort.dateASC.bind(null, 'end_date'));

            return activities;
        }
    };

    template.createNewActivity = function(laneId, callback) {
        var userId = Meteor.userId();
        var proceed = function() {
            Partup.client.popup.open({
                id: 'new-activity',
                parameters: {
                  laneId: laneId
                },
            },
            callback);
        };

        if (!userId) {
            Intent.go({route: 'login'}, function(user) {
                if (user) proceed();
            });
        } else {
            proceed();
        }
    };
});

Template.app_partup_activities.helpers({
    activities: function() {
        return Template.instance().activities.all({archived: false});
    },
    allActivities: function() {
        return Template.instance().activities.all();
    },
    archivedActivities: function() {
        return Template.instance().activities.all({archived: true});
    },
    isUpper: function() {
        var partupId = Template.instance().data.partupId;
        var partup = Partups.findOne({_id: partupId});

        if (!partup || !partup.uppers) return false;

        var user = Meteor.user();
        if (!user) return false;

        return partup.uppers.indexOf(user._id) > -1;
    },
    filterReactiveVar: function() {
        return Template.instance().activities.filter;
    },

    // Loading state
    activitiesLoading: function() {
        return Template.instance().activities.loading.get();
    },

    createCallback: function() {
        var template = Template.instance();
        return function(activityId) {
            Meteor.defer(function() {

                Partup.client.scroll.to(template.find('[data-activity-id=' + activityId + ']'), 0, {
                    duration: 250,
                    callback: function() {
                        template.$('[data-activity-id=' + activityId + ']').addClass('pu-state-highlight');
                    }
                });

            });
        };
    },
    boardViewEnabled: function() {
        var template = Template.instance();
        var partup = Partups.findOne(template.data.partupId);
        if (!partup) return false;
        return partup.board_view;
    },
    partupId: function() {
        return Template.instance().data.partupId;
    },
    onAddHook: function() {
        return Template.instance().createNewActivity;
    }
});

Template.app_partup_activities.events({
    'click [data-new-activity]': function(event, template) {
        event.preventDefault();

        template.createNewActivity(null, () => {
          const board = Boards.findOne({ partup_id: template.data.partupId });
          if (board && board.lanes) {
            const firstlane = board.lanes[0];
            const $lane = $(`[data-sortable-lane=${firstlane}]`);
            setTimeout(() => {
              $lane.animate({ scrollTop: $lane[0].scrollHeight }, '300');
            }, 250);
          }
        });
    }
});
