/**
 * Debug namespace
 * @class debug
 * @memberof Partup.client
 */
Partup.client.debug = {
    _enabled: false,
    enable(bool) {
      this._enabled = bool;
    },
    /**
     * @memberof Partup.client.debug
     */
    currentSubscriptions: function() {
        var subs = Meteor.default_connection._subscriptions;
        Object.keys(subs).forEach(function(key) {
            console.log(subs[key]);
        });
    },
    log(...args) {
      if (Meteor.isDevelopment && this._enabled) {
        console.debug(...args);
      }
    },
};
