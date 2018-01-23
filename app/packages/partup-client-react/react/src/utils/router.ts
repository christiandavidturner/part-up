const callbacks: any = [];
let currentLocationIndex = 0;

export const routes = [
    '/home',
    '/discover',
    '/profile',
    '/login',
    '/oauth',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/unsubscribe-email-all',
    '/unsubscribe-email-one',
    '/register',
    '/partups',
    '/close',
    '/admin',
    '/about',
    '/pricing',
    '/tribes',
    '/chats',
    '/',
];

export const activeRoutes: Array<string> = [
    // '/home',
];

function update(route?: any) {
    setCurrentIndex(route);
    callbacks.forEach((cb: Function) => {
        cb(routes[getCurrentIndex()]);
    });
}

function setCurrentIndex(pathname: string = window.location.pathname) {
    for (let i = 0; i < routes.length; i++) {
        if (pathname.startsWith(routes[i])) {
            currentLocationIndex = i;
            break;
        }
    }
}

function initialize() {
    (function(history: any) {
        const pushState = history.pushState;
        history.pushState = function(state: any) {
            if (typeof history.onpushstate === 'function') {
                history.onpushstate({ state: state });
            }
            update(arguments[2]);
            return pushState.apply(history, arguments);
        };
    })(window.history);

    window.addEventListener('popstate', () => {
        update();
    });

    setCurrentIndex();
}

export function onRouteChange(cb: Function) {
    callbacks.push(cb);
}

export function getCurrentIndex() {
    return currentLocationIndex;
}

export function getCurrentRoute() {
    return routes[currentLocationIndex];
}

initialize();
