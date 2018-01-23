// jscs:disable
/**
 * Render oauth grant functionality
 *
 * @module client-oauth
 *
 */
// jscs:enable

Template.OAuth.onCreated(function() {
    var template = this;
    template.submitting = new ReactiveVar(false);
    template.app = new ReactiveVar(null);
    Meteor.call('oauth.applications.find', template.data.clientId, function(error, result) {
        if (!error) {
            template.app.set(result);
        }
    });
});

Template.OAuth.events({
    'click #authButton': function() {
        var template = Template.instance();
        template.submitting.set(true);
        Meteor.call('oauth.grant', template.data.clientId, template.data.state, function(error, url) {
            template.submitting.set(false);
            if (!error) {
                window.location = url;
            }
        });
    }
});

Template.OAuth.helpers({
    attrs: function() {
        var obj = {};
        if (Template.instance().submitting.get()) {
            obj.disabled = 'disabled';
        }
        return obj;
    },
    app: function() {
        return Template.instance().app.get();
    }
});