/**
 * Client user helpers
 *
 * @class user
 * @memberOf Partup.client
 */
var beforeLogoutCallBacks = [];
var afterLogoutCallbacks = [];
Partup.client.user = {
    logout: function() {
        var Intercom = Intercom || undefined;

        if (Intercom) Intercom('shutdown');

        // before logout callbacks, to prevent errors
        beforeLogoutCallBacks.forEach(function(cb) {
            cb();
        });
        Partup.client.chatData.clear();
        lodash.defer(function() {
            Meteor.logout((err) => {
              if (err) {
                return;
              }
              afterLogoutCallbacks.forEach(cb => cb());
            });
        });
    },
    onBeforeLogout: function(cb) {
        beforeLogoutCallBacks.push(cb);
    },
    offBeforeLogout: function(cb) {
        var index = beforeLogoutCallBacks.indexOf(cb);
        if (index > -1) beforeLogoutCallBacks.splice(index, 1);
    },
    onAfterLogout: function(cb) {
      afterLogoutCallbacks.push(cb);
    },
    offAfterLogout: function(cb) {
      var index = afterLogoutCallbacks.indexOf(cb);
      if (index) afterLogoutCallbacks.splice(index, 1);
    }
};
