import _ from 'lodash';
import {strings} from 'meteor/partup-client-base';
import { setTimeout } from 'timers';

/*************************************************************/
/* Widget initial */
/*************************************************************/
Template.ActivityView.onCreated(function() {
    var template = this;

    this.activityId = template.data.activity ? template.data.activity._id : template.data.activity_id;
    this.activity = this.data.activity;

    template.activityDropdownOpen = new ReactiveVar(false);

    const partup = Partups.findOne(template.activity.partup_id);
    const updateId = get(template, 'activity.update_id');
    template.updateIsStarred = new ReactiveVar(partup && partup.starred_updates && partup.starred_updates.includes(updateId));

    template.expanded = new ReactiveVar(!!template.data.EXPANDED || !!template.data.CREATE_PARTUP);

    template.updateContribution = function(contribution, cb) {
        Meteor.call('contributions.update', template.activityId, contribution, cb);
    };

    this.update = Updates.findOne({ _id: this.data.updateId || get(Template.instance(), 'data.activity.update_id') });
    const filesHidden = template.data.FILES_EXPANDED !== undefined ? !template.data.FILES_EXPANDED : !ActiveRoute.name('partup-update')
    template.hidden = {
        comments: new ReactiveVar(template.data.BOARDVIEW || template.data.LIST_VIEW || (template.data.EXPANDED && !_.get(this.update, 'comments_count'))),
        files: new ReactiveVar(filesHidden),
    };

    if (template.data.COMMENTS_EXPANDED) {
        template.autorun(() => {
            const x = template.data.COMMENTS_EXPANDED.get();
            if (x !== undefined) {
                template.hidden.comments.set(!x);
            }
        });
    }
});

Template.ActivityView.onRendered(function() {
    if (this.data.EXPANDED && !this.hidden.comments.get()) {
        const commentEl = this.find('[data-commentfield]');
        if (commentEl) {
            setTimeout(() => {
                $(commentEl).focus();
            }, 150);
        }
    }
});

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.ActivityView.helpers({
    activityDropdownOpen: function() {
        return Template.instance().activityDropdownOpen;
    },
    hide() {
        const { files, comments } = Template.instance().hidden;
        return {
            files: files.get(),
            comments: comments.get(),
        };
    },
    renderWithMarkdown() {
        return function (text) {
            return strings.renderToMarkdownWithEmoji(text);
        }
    },
    truncateDescription() {
        return function(text) {
            // Because truncateHtmlString accepts only html we first need to process the description.
            // This is not an elegant solution but it works for now.
            const htmlText = strings.renderToMarkdownWithEmoji(text, 'pu-sub-description');
            const maxDescriptionLength = 55;
            return strings.truncateHtmlString(htmlText, maxDescriptionLength);
        };
    },
    partup: function() {
        if (!this.activity) return;
        return Partups.findOne(this.activity.partup_id);
    },
    contributions: function() {
        if (!this.activity || this.contribution_id) return undefined;
        return Contributions.find({ activity_id: this.activity._id, archived: { $ne: true } });
    },
    contribution: function() {
        if (!this.contribution_id) return;

        return Contributions.findOne(this.contribution_id);
    },
    isContributing() {
        const instance = Template.instance();
        return Contributions.find({ activity_id: instance.activityId, upper_id: Meteor.userId(), archived: { $ne: true } }).count();
    },
    expanded: function() {
        return Template.instance().expanded.get();
    },
    showChevron: function() {
        return this.EXPANDABLE && !Template.instance().expanded.get() && !this.contribution_id;
    },
    showEditButton: function() {
        return !this.READONLY && this.isUpper;
    },
    showMetaData: function() {
        return (this.activity && this.activity.end_date) || this.COMMENTS_LINK;
    },
    showInviteButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        return true;
    },
    showContributeButton: function() {
        if (this.contribution_id) return false;
        if (this.READONLY) return false;

        var user = Meteor.user();
        if (!user) return false;

        var contributions = Contributions.findForActivity(this.activity).fetch();
        for (var i = 0; i < contributions.length; i++) {
            if (contributions[i].upper_id === user._id && !contributions[i].archived) return false;
        }

        return true;
    },
    updateContribution: function() {
        return Template.instance().updateContribution;
    },
    upper: function(event, template) {
        return Meteor.users.findOne({_id: this.upper_id});
    },
    isReadOnly: function() {
        return Template.instance().data.READONLY;
    },
    update: function() {
        return Updates.findOne({_id: this.updateId || get(Template.instance(), 'data.activity.update_id')});
    },
    popupId: function() {
        return 'popup.motivation.' + (this.updateId || get(Template.instance(), 'data.activity.update_id'));
    },
    newComments: function(upper_data) {
        upper_data = upper_data.hash.upper_data;
        if (!upper_data) return;

        var newComments = [];
        upper_data.forEach(function(upperData) {
            if (upperData._id === Meteor.userId()) {
                newComments = upperData.new_comments;
            }
        });
        return newComments.length;
    },
    lane: function() {
        const laneId = get(this.activity, 'lane_id');
        if (laneId) {
            const partupId = get(this.activity, 'partup_id') || this.partupId;
            if (get(Partups.findOne({ _id: partupId }), 'board_view')) {
                return Lanes.findOne({ _id: laneId });
            }
        }
    },
    updateDetail: function() {
        return Router.current().route.getName() === 'partup-update';
    },
    files() {
        const { files } = this.activity;
        return files || undefined;
    },
    fileCount() {
        const { files } = this.activity;
        return files ? _.concat(files.images, files.documents).length : 0;
    },
    dropdownData() {
        const instance = Template.instance();
        const self = this;
        return {
            activity() {
                return self.activity;
            },
            isContributing() {
                return Contributions.find({ activity_id: instance.activityId, upper_id: Meteor.userId(), archived: { $ne: true } }).count();
            },
            isUpper() {
                return User(Meteor.user()).isPartnerInPartup(get(self.activity, 'partup_id') || self.partupId);
            },
            updateIsStarred() {
                return instance.updateIsStarred.get();
            },
            mayEditActivity() {
              const partupId = _.get(self.activity, 'partup_id', undefined);
              return User(Meteor.user()).isPartnerInPartup(partupId);
            },
        };
    },
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.ActivityView.events({
    'click [data-detail]'(event, templateInstance) {
        // Don't do anything when already on detail.
        if (this.EXPANDED) {
            return true;
        }

        const partup = Partups.findOne({ _id: templateInstance.data.activity.partup_id });
        const detailIsFiles = $($(event.target).closest('[data-detail]')).data('detail');

        if (templateInstance.data.BOARDVIEW || (templateInstance.data.EXPANDABLE && !templateInstance.expanded.get())) {
            Router.go('partup-update', {
                slug: partup.slug,
                update_id: templateInstance.data.updateId || templateInstance.data.activity.update_id,
            }, {
                query: `fe=${detailIsFiles === 'files'}`,
            });
        }
    },
    'click [data-toggle]'(event, templateInstance) {
        // This will get triggered before [data-detail] above.
        // we don't want to expand when on boardview but go to the detail instead.
        if (this.BOARDVIEW) {
            return true;
        }

        const who = $(event.target).data('toggle');
        const hide = templateInstance.hidden[who];
        const newVal = hide.get();

        const toggleHide = () => {
            if (hide) {
                hide.set(!hide.get());
            }
        };

        const setFocus = () => {
            setTimeout(() => {
                const $commentElement = $(templateInstance.find('[data-commentfield]'));
                if ($commentElement) {
                    const method = newVal ? 'focus' : 'blur';
                    $commentElement[method]();
                }
            }, 150);
        };

        if (who === 'comments') {
            if (!Meteor.user() && templateInstance.update.comments_count < 1) {
                Intent.go({
                    route: 'login',
                }, function() {
                    if (Meteor.user()) {
                        toggleHide();
                        setFocus();
                    }
                });
            } else {
                if (!ActiveRoute.name(/!?update$/) && !newVal) {
                    const { partup_id, update_id } = templateInstance.activity;
                    const { slug } = Partups.findOne(partup_id);
                    Router.go('partup-update', { slug, update_id: update_id });
                } else {
                    toggleHide();
                    setFocus();
                }
            }
        } else {
            toggleHide();
        }
    },
    'click [data-dropdown-open]': function(event, template) {
        event.preventDefault();
        template.activityDropdownOpen.set(true);
    },
    'click [data-edit]': function(event, template) {
        const open = () => {
            Partup.client.popup.open({
                id: `edit-activity-${template.activity._id}`,
            });
        };
        if (!Meteor.userId()) {
            Intent.go({ route: 'login' }, function(user) {
                if (user) open();
            });
        } else {
            open();
        }
    },
    'click [data-activity-expander]': function(event, template) {
        var partup = Partups.findOne({_id: template.data.activity.partup_id});
        if (template.data.BOARDVIEW) {
            Router.go('partup-update', {
                slug: partup.slug,
                update_id: template.data.updateId || template.data.activity.update_id
            });
        }

        if (!template.data.EXPANDABLE) return;

        var opened = template.expanded.get();
        template.expanded.set(!opened);
    },
    'click [data-contribute]': function(event, template) {
        event.preventDefault();

        var contribute = function() {
            var partup = Partups.findOne({_id: template.data.activity.partup_id});

            if (!partup) {
                Partup.client.notify.error('Couldn\'t proceed your contribution. Please try again!');
                return;
            }

            // If the user is not a partner, ask for motivation
            if (!partup.hasUpper(Meteor.userId())) {
                var popupId = 'popup.motivation.' + (template.data.updateId || template.data.activity.update_id);
                Partup.client.popup.open({
                    id: popupId
                }, function(result) {
                    if (result && result.success) {
                        template.updateContribution({
                            motivation: result.comment
                        }, function(error) {
                            if (error) {
                                return;
                            }

                            try {
                                analytics.track('new contribution', {
                                    partupId: partup._id,
                                    userId: Meteor.userId(),
                                    userType: 'supporter'
                                });
                            } catch (err) { }
                        });
                    }
                });

                return;
            }
            template.updateContribution({}, function(error, result) {
                if (error) {
                    return;
                }

                try {
                    analytics.track('new contribution', {
                        partupId: partup._id,
                        userId: Meteor.userId(),
                        userType: 'upper'
                    });
                } catch (e) {}
            });
        };

        template.activityDropdownOpen.set(false);
        if (Meteor.user()) {
            contribute();
        } else {
            Intent.go({route: 'login'}, function() {
                contribute();
            });
        }
    },
    'click [data-invite]': function(event, template) {
        event.preventDefault();
        var partup = Partups.findOne({_id: template.data.activity.partup_id});
        Intent.go({
            route: 'partup-activity-invite',
            params: {
                slug: partup.slug,
                activity_id: template.data.activity._id
            }
        });
    },
    'click [data-archive]': (event, template) => {
        Meteor.call('activities.archive', template.data.activity._id, function(error) {
            if (error) {
                Partup.client.notify.error(error.reason)
            }
            template.activityDropdownOpen.set(false)
        })
    },
    'click [data-unarchive]': (event, template) => {
        Meteor.call('activities.unarchive', template.data.activity._id, function(error) {
            if (error) {
                Partup.client.notify.error(error.reason)
            }
            template.activityDropdownOpen.set(false)
        })
    },
    'click [data-star-activity]': function(event, template) {
        event.preventDefault();

        const updateId = get(template, 'activity.update_id');
        template.updateIsStarred.set(true);

        Meteor.call('updates.messages.star', updateId, function(error, result) {
            if (error) {
                template.updateIsStarred.set(false);
                if (error.reason === 'partup_message_too_many_stars') {
                    Partup.client.notify.error(TAPi18n.__('pur-partup-start-error-too_many_starred_updates'));
                } else {
                    Partup.client.notify.error('Could not star update');
                }
                return;
            }
            Partup.client.notify.success('Update starred');
        });

        template.activityDropdownOpen.set(false);
    },
    'click [data-unstar-activity]': function(event, template) {
        event.preventDefault();

        const updateId = get(template, 'activity.update_id');
        template.updateIsStarred.set(false);

        Meteor.call('updates.messages.unstar', updateId, function(error, result) {
            if (error) {
                template.updateIsStarred.set(true);
                Partup.client.notify.error('Could not unstar update');
                return;
            }
            Partup.client.notify.success('Update unstarred');
        });

        template.activityDropdownOpen.set(false);
    },
});
