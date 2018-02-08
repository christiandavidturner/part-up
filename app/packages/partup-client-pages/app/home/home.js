Template.app_home.onCreated(function() {
    var template = this;
    template.intro = new ReactiveVar(true);
    template.segments = new ReactiveVar(false);
    template.carousel = new ReactiveVar(false);
    template.products = new ReactiveVar(false);
    template.form = new ReactiveVar(false);
    template.footer = new ReactiveVar(false);

    template.headerExpandedVar = new ReactiveVar(false, function(a, b) {
        if (b) _.defer(function() {template.intro.set(true);});
    });
});

Template.app_home.onRendered(function() {
    var template = this;
    var isElementInViewPort = function(el) {

        //special bonus for those using jQuery
        if (typeof jQuery === 'function' && el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.top < (window.innerHeight * 0.8)
        );
    };

    template.handler = function() {
        if (isElementInViewPort($('[data-home-intro]'))) {
            template.intro.set(true);
        }
        if (isElementInViewPort($('[data-home-segments]'))) {
            template.segments.set(true);
        }
        if (isElementInViewPort($('[data-home-carousel]'))) {
            template.carousel.set(true);
        }
        if (isElementInViewPort($('[data-home-products]'))) {
            template.products.set(true);
        }
        if (isElementInViewPort($('[data-home-form]'))) {
            template.form.set(true);
        }
        if (isElementInViewPort($('[data-home-footer]'))) {
            template.footer.set(true);
        }
    };

    $(window).on('DOMContentLoaded load resize scroll', template.handler);
});

Template.app_home.onDestroyed(function() {
    var template = this;
    $(window).off('DOMContentLoaded load resize scroll', template.handler);
});

Template.app_home.helpers({
    render: function() {
        var template = Template.instance();
        return {
            intro: function() {
                return template.intro.get();
            },
            segments: function() {
                return template.segments.get();
            },
            carousel: function() {
                return template.carousel.get();
            },
            products: function() {
                return template.products.get();
            },
            form: function() {
                return template.form.get();
            },
            footer: function() {
                return template.footer.get();
            }
        };
    },
    headerExpandedVar: function() {
        return Template.instance().headerExpandedVar;
    },
    headerExpanded: function() {
        return Template.instance().headerExpandedVar.get();
    }
});
