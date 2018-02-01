import { strings } from 'meteor/partup-client-base';

Template.update_partups_message_added.onCreated(function() {
    let template = this;

    template.dropdownOpen = new ReactiveVar(false);

    const updateId = template.data._id;
    const partup = Partups.findOne({ _id: template.data.partup_id });

    if (partup) {
        template.updateIsStarred = new ReactiveVar(
            partup &&
                partup.starred_updates &&
                partup.starred_updates.includes(updateId)
        );
    } else {
        template.updateIsStarred = new ReactiveVar(false);
    }
});

Template.update_partups_message_added.helpers({
    hasMenuEntries() {
      const { upper_id, partup_id } = Template.instance().data;
      const user = Meteor.user();
      if (user) {
        return upper_id === user._id || User(user).isPartnerInPartup(partup_id);
      }
      return false;
    },
    dropdownOpen: function() {
        return Template.instance().dropdownOpen;
    },
    isUpper() {
        return User(Meteor.user()).isPartnerInPartup(
            Template.instance().data.partup_id
        );
    },
    dropdownData() {
        const instance = Template.instance();
        return {
            updateIsFromCurrentUser() {
                return instance.data.upper_id === Meteor.userId();
            },
            updateIsStarred() {
                return instance.updateIsStarred.get();
            },
            hasNoComments: function() {
                if (instance.data.comments) {
                    return instance.data.comments.length <= 0;
                } else {
                    return true;
                }
            },
            mayRemove() {
                return this.hasNoComments() && this.updateIsFromCurrentUser();
            },
            editMessagePopupId: function() {
                return 'edit-message-' + instance.data._id;
            },
        };
    },
    messageContent: function() {
        let self = this;
        let rawNewValue = self.type_data.new_value;
        return strings.renderToMarkdownWithEmoji(rawNewValue);
    },
    areDocumentIds(documents) {
        return (documents || []).filter((doc) => typeof doc === 'string');
    },
});

Template.update_partups_message_added.events({
    'click [data-dropdown-open]': function(event, template) {
        event.preventDefault();
        template.dropdownOpen.set(true);
    },
    'click [data-star-message]': function(event, template) {
        event.preventDefault();
        const updateId = template.data._id;
        template.updateIsStarred.set(true);

        Meteor.call('updates.messages.star', updateId, function(error, result) {
            if (error) {
                template.updateIsStarred.set(false);
                if (error.reason === 'partup_message_too_many_stars') {
                    Partup.client.notify.error(
                        TAPi18n.__(
                            'pur-partup-start-error-too_many_starred_updates'
                        )
                    );
                } else {
                    Partup.client.notify.error('Could not star update');
                }

                return;
            }

            Partup.client.notify.success('Update starred');
        });

        template.dropdownOpen.set(false);
    },
    'click [data-unstar-message]': function(event, template) {
        event.preventDefault();

        const updateId = template.data._id;
        template.updateIsStarred.set(false);

        Meteor.call('updates.messages.unstar', updateId, function(
            error,
            result
        ) {
            if (error) {
                template.updateIsStarred.set(true);
                Partup.client.notify.error('Could not unstar update');
                return;
            }

            Partup.client.notify.success('Update unstarred');
        });

        template.dropdownOpen.set(false);
    },
});
