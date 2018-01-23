'use strict';

declare global {
    interface Window {
        TAPi18n: any;
        i18next: any;
        Router: any;
        RENDER_REACT: any;
        UNRENDER_REACT: any;
        REACT_USER_LOGIN: any;
        REACT_USER_LOGOUT: any;
    }
}

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
    BrowserRouter,
    MemoryRouter,
} from 'react-router-dom';

import { routes, getCurrentIndex } from 'utils/router';

import { App, renderInstanceType } from './App';

import './index.css';
import { Dispatcher } from 'utils/Dispatcher';
import { onStartup } from 'utils/MeteorStartup';

const dev = process.env.REACT_APP_DEV;

let Router: any = null;
if (dev) {
    Router = BrowserRouter;
} else {
    Router = MemoryRouter;
}

window.RENDER_REACT = (rootEl: string, instance: renderInstanceType, metaData: Object) => {
    const root = document.getElementById(rootEl);

    if (!root) return;

    onStartup(() => {
        ReactDOM.render(
            <Router
                initialEntries={routes}
                initialIndex={getCurrentIndex()}>
                <App render={instance} data={metaData} />
            </Router>,
            root,
        );
    });
};

window.UNRENDER_REACT = (rootEl: string) => {
    const root = document.getElementById(rootEl);

    if (!root) return;

    ReactDOM.unmountComponentAtNode(root);
};

export const userDispatcher = new Dispatcher();

window.REACT_USER_LOGIN = () => {
    userDispatcher.dispatch('login', {});
};

window.REACT_USER_LOGOUT = () => {
    userDispatcher.dispatch('logout', {});
};

if (dev) {
    onStartup(() => {
        window.RENDER_REACT('react-root', 'home');
    });
}
