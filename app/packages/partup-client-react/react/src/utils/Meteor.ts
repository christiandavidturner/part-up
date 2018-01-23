import { onStartup } from 'utils/MeteorStartup';

export const { default: Meteor } = require('react-web-meteor');

interface MeteorDocument {
    _id: string;
}

export interface MeteorCollection {
    find(selector: Object, options: Object): MeteorDocument[];
    findOne(selector: Object, options: Object): MeteorDocument | undefined;
}

onStartup(() => {
    if (process.env.REACT_APP_DEV) {
        Meteor.connect('ws://localhost:3000/websocket');
    } else {
        const { protocol, host } = window.location;

        Meteor.connect(`${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}/websocket`);
    }

    loginWithMeteorToken();
});

let currentLoginToken: any = null;

export function loginWithMeteorToken() {
    const newMeteorLoginToken = getLoginToken();

    if (newMeteorLoginToken !== currentLoginToken) {
        Meteor._loginWithToken(newMeteorLoginToken);
    }

    currentLoginToken = newMeteorLoginToken;
}

export function getLoginToken() {

    return window.localStorage.getItem('Meteor.loginToken');
}

export function onLogin(cb: Function) {

    if (Meteor.user()) return cb();

    Meteor.Accounts.onLogin(cb);
}

export function onLogout() {
    window.localStorage.removeItem('Meteor.loginToken');

    if (Router) {
        Router.go('home');
    }
}

export function onLoginFailure(cb: Function) {
    Meteor.Accounts.onLoginFailure(cb);
}
