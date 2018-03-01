import { throttle } from 'lodash';

const footerScrollHandler = ($el) => (evt) => {
  if ($(document).scrollTop() > 25) {
    $el.addClass('pu-sub-modalfooter-scrolling-active')
  } else {
    $el.removeClass('pu-sub-modalfooter-scrolling-active')
  }
};

Template.modal.onRendered(function() {
    var $body = $('body');
    $body.removeClass('pu-state-currentlayout-app');
    $body.addClass('pu-state-currentlayout-modal');

    const $footerEl = $('footer');
    this.handler = throttle(footerScrollHandler($footerEl), 250);
    if ($footerEl) {
      document.addEventListener('scroll', this.handler, { passive: true });
    }
});

Template.modal.onDestroyed(function() {
  document.removeEventListener('scroll', this.handler);
});

/*************************************************************/
/* modal helpers */
/*************************************************************/
Template.modal.helpers({
    focusLayerEnabled: function() {
        return Partup.client.focuslayer.state.get();
    }
});

/*************************************************************/
/* modal events */
/*************************************************************/
Template.modal.events({
    'click [data-focuslayer]': function() {
        Partup.client.focuslayer.disable();
    }
});
