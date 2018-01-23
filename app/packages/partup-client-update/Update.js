// jscs:disable
/**
 * Widget to render an update
 *
 * You can pass the widget a few options which enable various functionalities
 *
 * @module client-update
 * @param {String} updateId             The update id of the update that has to be rendered
 * @param {Object} metadata             Non reactive metadata, such as user, time and title
 * @param {Boolean} LINK                Show link yes or no
 * @param {Boolean} SHOW_COMMENTS       Show existing comments
 * @param {Boolean} COMMENT_LIMIT       Limit the amount of comments expanded (0 for no limit, default)
 * @param {Boolean} FORCE_COMMENTFORM   always show the comment form
 */
// jscs:enable

/** ***********************************************************/
/* Widget created */
/** ***********************************************************/
Template.Update.onCreated(function() {
    let template = this;
    let updateId = template.data.updateId;
    let update = Updates.findOne({ _id: updateId });

    if (update) {
        let partup = Partups.findOne({ _id: update.partup_id });

        if (partup) {
            template.updateIsStarred = new ReactiveVar(
                partup &&
                    partup.starred_updates &&
                    partup.starred_updates.includes(updateId)
            );
        }
    }

    template.commentInputFieldExpanded = new ReactiveVar(false);
    template.showCommentClicked = new ReactiveVar(false);

    const initialExpandedValue = ActiveRoute.name('partup-update') ? true : undefined;
    template.commentsExpanded = new ReactiveVar(initialExpandedValue, (oldVal, newVal) => {
        template.commentInputFieldExpanded.set(newVal);
        template.showCommentClicked.set(newVal);
    });
});

/** ***********************************************************/
/* Widget helpers */
/** ***********************************************************/
Template.Update.helpers({
    update: function() {
        const templateInstance = Template.instance();
        let self = this;
        let template = Template.instance();
        let updateId = template.data.updateId;
        if (!updateId) return; // no updateId found, return
        let update = Updates.findOne({ _id: updateId });
        if (!update) return; // no update found, return
        let partup = Partups.findOne({ _id: update.partup_id });
        let activity = Activities.findOne({
            _id: update.type_data.activity_id,
        });
        let contribution = Contributions.findOne({
            _id: update.type_data.contribution_id,
        });
        let contributor;
        if (contribution) {
            contributor = Meteor.users.findOne(contribution.upper_id);
        }
        let user = Meteor.user();
        return {
            data: function() {
                return update;
            },
            templateName: function() {
              if (update.type === 'partups_activities_invited') {
                return 'update_partups_invited';
              }
              return 'update_' + update.type;
            },
            activityData: function() {
                return activity;
            },
            showCommentButton: function() {
                if (template.data.IS_DETAIL) return false; // check if this is the detail view
                if (update.comments_count) return false; // check total comments
                if (self.metadata.is_system) return false; // check if contribution or systemmessage

                return true;
            },
            isDetail: function() {
                return template.data.IS_DETAIL ? true : false;
            },
            isNotDetail: function() {
                return template.data.IS_DETAIL ? false : true;
            },
            title: function() {
                let titleKey =
                    'update-type-' + self.metadata.update_type + '-title';
                let params = {};

                // Initiator name
                if (get(self, 'metadata.updateUpper')) {
                    params.name = User(
                        self.metadata.updateUpper
                    ).getFirstname();
                } else if (self.metadata.is_system) {
                    params.name = 'Part-up';
                }
                // Invited names
                if (get(self, 'metadata.invitee_names')) {
                    // This method was needed, since a simpler pop() and join(', ) to create the sentence was glitching,
                    // because the update updates every now and then, so it was skipping names because of the pop
                    let nameListCount = self.metadata.invitee_names.length;
                    let nameSentence = self.metadata.invitee_names[0];
                    if (nameListCount > 1) {
                        self.metadata.invitee_names.forEach(function(
                            name,
                            index
                        ) {
                            if (index === 0) return; // Already in sentence
                            if (index === nameListCount - 1) {
                                nameSentence =
                                    nameSentence +
                                    ' ' +
                                    TAPi18n.__('update-general-and') +
                                    ' ' +
                                    name; // Last name of the list
                            } else {
                                nameSentence = nameSentence + ', ' + name; // Just add it up
                            }
                        });
                    }

                    params.invitee_names = nameSentence;
                }

                // Activity title
                if (self.metadata.is_contribution || self.metadata.is_rating) {
                    params.activity = activity.name;
                }

                // Contributor name
                if (self.metadata.is_rating) {
                    params.contributor = User(contributor).getFirstname();
                }

                return TAPi18n.__(titleKey, params);
            },
            mayComment: function() {
                return user ? true : false;
            },
            showCommentClicked: function() {
                return template.showCommentClicked.get();
            },
            isUpper: function() {
                if (!user) return false;
                if (!partup) return false;
                return partup.uppers.indexOf(user._id) > -1;
            },

            isPartnerInPartup: function() {
                return User(user).isPartnerInPartup(partup._id);
            },

            updateIsStarred: function() {
                return template.updateIsStarred.get();
            },

            systemMessageContent: function() {
                return Partup.client.strings.newlineToBreak(
                    TAPi18n.__(
                        'update-type-partups_message_added-system-' +
                            self.type +
                            '-content'
                    )
                );
            },

            commentable: function() {
                return (
                    !self.metadata.is_contribution && !self.metadata.is_system
                );
            },
            hasNoComments: function() {
                if (update.comments) {
                    return update.comments.length <= 0;
                } else {
                    return true;
                }
            },
            FILES_EXPANDED() {
                return templateInstance.data.FILES_EXPANDED;
            },
        };
    },
    format() {
        return function(content) {
            return new Partup.client.message(content)
                .sanitize()
                .autoLink()
                .getContent();
        };
    },
    commentsExpanded() {
        return Template.instance().commentsExpanded;
    },
});

/** ***********************************************************/
/* Widget events */
/** ***********************************************************/
Template.Update.events({
    'click [data-expand-comment-field]': function(event, template) {
        event.preventDefault();

        let updateId = this.updateId;
        let proceed = function() {
            template.commentsExpanded.set(true);

            Meteor.defer(function() {
                let commentForm = template.find(
                    '[id$=commentForm-' + updateId + ']'
                );
                let field = lodash.find(commentForm, { name: 'content' });
                if (field) field.focus();
            });
        };

        if (Meteor.user()) {
            proceed();
        } else {
            Intent.go({ route: 'login' }, function() {
                if (Meteor.user()) {
                    proceed();
                } else {
                    this.back();
                }
            });
        }
    },
    'click [data-edit-message]': function(event, template) {
        event.preventDefault();
        Partup.client.popup.open({
            id: 'edit-message-' + template.data.updateId,
        });
    },
    'click [data-remove-message]': function(event, template) {
        event.preventDefault();
        let updateId = template.data.updateId;
        Partup.client.prompt.confirm({
            title: 'Please confirm',
            message:
                'Do you really want to remove this message? This action cannot be undone.',
            onConfirm: function() {
                Meteor.call('updates.messages.remove', updateId, function(
                    error,
                    result
                ) {
                    if (error) {
                        Partup.client.notify.error(error.reason);
                        return;
                    }
                    $(template.view.firstNode()).remove();
                    if (template.view) Blaze.remove(template.view);
                    Partup.client.notify.success('Message removed');
                });
            },
        });
    },
});
