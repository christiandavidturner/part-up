Partup.client.browser = {
    isIE: function() {
        let ua = window.navigator.userAgent;
        let msie = ua.indexOf('MSIE ');

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
            return true;
        }

        if (/Edge/.test(navigator.userAgent)) {
            // this is Microsoft Edge
            return true;
        }

        return false;
    },

    msieversion: function() {
        let ua = window.navigator.userAgent;
        let msie = ua.indexOf('MSIE ');

        if (msie > 0) {
            // If Internet Explorer, return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)));
        } else {
            // If another browser, return 0
            return 0;
        }
    },

    isSafari: function() {
        return /^((?!chrome|android|crios|fxios).)*safari/i.test(
            navigator.userAgent
        );
    },
    isChromeOrSafari: function() {
        let ua = window.navigator.userAgent;

        let is_chrome = ua.indexOf('Chrome') > -1;
        let is_safari = ua.indexOf('Safari') > -1;

        return is_chrome || is_safari;
    },

    getMobileOperatingSystem() {
        let userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Windows Phone must come first because its UA also contains "Android"
        if (/windows phone/i.test(userAgent)) {
            return 'windows-phone';
        }

        if (/android/i.test(userAgent)) {
            return 'android';
        }

        // iOS detection from: http://stackoverflow.com/a/9039885/177710
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
        }

        return undefined;
    },

    onMobileOs: function(callback) {
        let os = this.getMobileOperatingSystem();
        if (os == 'ios') callback();
        if (os == 'android') callback();
    },

    getAppStoreLink: function() {
        let os = Partup.client.browser.getMobileOperatingSystem();
        switch (os) {
            case 'ios':
                return TAPi18n.__('more-menu-list-for-ios-url');
                break;
            case 'android':
                return TAPi18n.__('more-menu-list-for-android-url');
                break;
            default:
                // revert to ios link by default
                return TAPi18n.__('more-menu-list-for-ios-url');
        }
    },
};
