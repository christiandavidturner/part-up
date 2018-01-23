import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as moment from 'moment';
import { Meteor, onLogin, onLoginFailure, loginWithMeteorToken, onLogout } from 'utils/Meteor';
import { Subscriber } from 'utils/Subscriber';
import {
    Switch,
    Route,
} from 'react-router-dom';
// import { onRouteChange } from 'utils/router';
import { View } from 'components/View/View';
import { DevelopmentNavigation } from 'implementations/DevelopmentNavigation';
// import { Router } from 'components/Router/Router';
import { NotificationsManager } from 'components/NotificationsManager/NotificationsManager';
import { Dashboard } from 'views/Dashboard/Dashboard';
import { Start } from 'views/Partup/Start';
import { UserDocument } from 'collections/Users';
import { get } from 'lodash';

import 'moment/locale/nl';
import { userDispatcher } from 'index';
import { Tracker } from 'utils/Tracker';

const dev = process.env.REACT_APP_DEV;

interface Props {
    className?: string;
}

class Container extends React.Component<Props, {}> {

    public render() {
        const { children } = this.props;

        if (dev) {
            return this.renderDevelopmentContainer();
        }

        return (
            <View>
                {children}
            </View>
        );
    }

    private renderDevelopmentContainer() {
        const { children } = this.props;

        return (
            <View>
                <DevelopmentNavigation />
                {children}
            </View>
        );
    }
}

interface State {
    user?: UserDocument;
    loginFailed: boolean;
}

export interface AppContext {
    user?: UserDocument;
    refreshUser: Function;
}

export type renderInstanceType = 'home' | 'partup-start';

interface AppProps extends Props {
    render: renderInstanceType;
    data: any;
}

export class App extends React.Component<AppProps, State> {

    public static childContextTypes = {
        user: PropTypes.object,
        refreshUser: PropTypes.func,
    };

    public state: State = {
        user: undefined,
        loginFailed: false,
    };

    // current user subscription (not yet active)
    private userSubscription = new Subscriber({
        subscription: 'users.loggedin',
        onStateChange: () => this.forceUpdate(),
    });

    // current user tracker, triggers re-render when current user changes
    private currentUserTracker = new Tracker<UserDocument>({
        collection: 'users',
        onChange: (event) => {
            if (!event.currentDocument) return;

            if (event.currentDocument._id === Meteor.userId()) {
                this.forceUpdate();
            }
        },
    });

    public getChildContext(): AppContext {
        const { user } = this.state;

        return {
            user,
            refreshUser: this.refreshUser,
        };
    }

    // load user data, activates user subscription
    public loadUserData = async () => {

        // activate user subscription
        await this.userSubscription.subscribe();

        // Gets current user from minimongo and sets it on this.state
        this.refreshUser();

        // onLogin handler (same as Accounts.onLogin)
        onLogin(async () => {
            this.setState({ loginFailed: false });

            // refresh user on state
            this.refreshUser();

            // set app locale based on user
            const user = Meteor.user();
            const locale = get(user, 'profile.settings.locale') || 'en';

            moment.locale(locale);
        });

        onLoginFailure(() => {
            this.setState({ loginFailed: true });
        });
    }

    public componentWillMount() {
        this.loadUserData();

        loginWithMeteorToken();

        userDispatcher.subscribe('login', this.userLoginHandler);
        userDispatcher.subscribe('logout', this.userLogoutHandler);
    }

    public componentWillUnmount() {
        this.currentUserTracker.destroy();

        this.userSubscription.unsubscribe();

        userDispatcher.unsubscribe('login', this.userLoginHandler);
        userDispatcher.unsubscribe('logout', this.userLogoutHandler);
    }

    public render() {

        if (dev) {
            return this.renderDevelopmentApp();
        }

        return (
            <Container>
                {this.renderInstance()}
                <NotificationsManager />
            </Container>
        );

    }

    private renderDevelopmentApp() {
        const partupId = 'gJngF65ZWyS9f3NDE';

        return (
            <Container>
                <Switch>
                    <Route path={'/home'} component={Dashboard}/>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: '0 0 400px', height: '100vh', background: '#eeeeee' }} />
                        <div style={{ flex: '1', height: '100vh', padding: '2.5em', background: '#e6e6e6' }}>
                            <Route path={'/partup-start'} render={(props) => <Start {...props} partupId={partupId} />} />
                        </div>
                    </div>
                </Switch>
                <NotificationsManager />
            </Container>
        );
    }

    private renderInstance = () => {
        const { render, data } = this.props;

        // Not a logged in route
        if (render === 'partup-start') {
            return <Route path={'/'} render={(props) => <Start {...props} partupId={data.partupId} />} />;
        }

        // Logged in routes.
        const { loginFailed, user } = this.state;

        if (loginFailed || !user) {
            return null;
        }

        if (render === 'home') {
            return <Route path={'/home'} component={Dashboard} />;
        }

        return undefined;
    }

    private refreshUser = () => {
        this.setState({
            user: Meteor.user(),
        });
    }

    private userLoginHandler = () => {
        loginWithMeteorToken();
    }

    private userLogoutHandler = () => {
        Meteor.logout();

        onLogout();

        this.setState({
            user: undefined,
        });
    }
}
