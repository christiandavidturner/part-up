import { Meteor } from 'utils/Meteor';

// Meteor.onStartup polyfill for React

const callbackQueue: Array<any> = [];
let isLoadingCompleted = false;
let isReady = false;

const maybeReady = () => {
    if (isReady || !isLoadingCompleted) return;

    isReady = true;

    // Run startup callbacks
    while (callbackQueue.length) {
        (callbackQueue.shift())();
    }
};

const loadingCompleted = () => {
    if (!isLoadingCompleted) {
        isLoadingCompleted = true;
        maybeReady();
    }
};

if (document.readyState === 'complete' || document.readyState === 'loaded') {
    // Loading has completed,
    // but allow other scripts the opportunity to hold ready
    window.setTimeout(loadingCompleted);
} else { // Attach event listeners to wait for loading to complete
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', loadingCompleted, false);
        window.addEventListener('load', loadingCompleted, false);
    } else { // Use IE event model for < IE9
        const ieEvent = 'attachEvent';
        document[ieEvent]('onreadystatechange', () => {
            if (document.readyState === 'complete') {
                loadingCompleted();
            }
        });
        window[ieEvent]('load', loadingCompleted);
    }
}

export function onStartup(callback: Function) {
    const ieEvent = 'doScroll';
    // Fix for < IE9, see http://javascript.nwbox.com/IEContentLoaded/
    const doScroll = !document.addEventListener && document.documentElement[ieEvent];

    const callOnStartupCallback = () => {
        console.log('React Meteor started');
        callback();
    };

    if (!doScroll || window !== top) {
        if (isReady) {
            callOnStartupCallback();
        } else {
            callbackQueue.push(callback);
        }
    } else {
        try {
            doScroll('left');
        } catch (error) {
            setTimeout(() => {
                Meteor.startup(callback);
            }, 50);
            return;
        }
        callOnStartupCallback();
    }
}
