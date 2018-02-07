Template.Home_Header.helpers({
    greeting: function () {
        var daypart;
        var hour = moment().hours();

        if (hour < 6) daypart = 'night';
        else if (hour < 12) daypart = 'morning';
        else if (hour < 18) daypart = 'afternoon';
        else if (hour < 24) daypart = 'evening';
        else daypart = 'fallback';

        return TAPi18n.__('pages-app-home-loggedin-greeting-' + daypart);
    },
    firstName: function () {
        return User(Meteor.user()).getFirstname();
    }
});

Template.Home_Header_CallToAction.events({
    'input [data-register-email]': function (event, template) {
        template.email = $('[data-register-email]').val();
    },
    'click [data-register-button]': function (event, template) {
        Router.go('register', {}, { query: 'email=' + template.email });
    },
    'submit [data-register-form]': function (event, template) {
        event.preventDefault();
        Router.go('register', {}, { query: 'email=' + template.email });
    }
});
