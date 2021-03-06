/**
 * Render invite to part-up activity functionality
 *
 * @module client-invite-to-partup-activity
 *
 */
Template.InviteToActivity.onCreated(function() {
    var template = this;
    template.submitting = new ReactiveVar(false);
});

Template.InviteToActivity.helpers({
    form: function() {
        var template = Template.instance();
        var activity = Activities.findOne(template.data.activityId);
        var partup = Partups.findOne(activity.partup_id);
        return {
            schema: Partup.schemas.forms.inviteUpper,
            doc: function() {
                return {
                    message: TAPi18n.__('invite-to-activity-popup-message-prefill', {
                        partupName: partup.name,
                        activityName: activity.name,
                        inviterName: Meteor.user().profile.name
                    })
                };
            },
            classNames: function () {
                var cNames = 'pu-form';
                if (!template.data.nopopup) cName += ' pu-form-popup';
                return cNames;
            }
        };
    },
    state: function() {
        var template = Template.instance();
        return {
            submitting: function() {
                return template.submitting.get();
            },
        };
    }
});

AutoForm.hooks({
    inviteToActivityForm: {
        onSubmit: function(insertDoc, updateDoc, currentDoc) {
            var self = this;
            var template = self.template.parent();

            var parent = Template.instance().parent();
            parent.submitting.set(true);

            Meteor.call('activities.invite_by_email', template.data.activityId, insertDoc,
                function(error, result) {
                    parent.submitting.set(false);
                    if (error) {
                        return Partup.client.notify.error(TAPi18n.__('base-errors-' + error.reason));
                    }
                    Partup.client.notify.success(TAPi18n.__('invite-to-activity-popup-success'));
                    Partup.client.popup.close();
                });

            return false;
        }
    }
});
