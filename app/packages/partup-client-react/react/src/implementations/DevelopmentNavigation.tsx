import * as React from 'react';
import { NavigationBar } from 'components/NavigationBar/NavigationBar';
import { List } from 'components/List/List';
import { MainNavLink } from 'components/Router/MainNavLink';
import { ListItem } from 'components/List/ListItem';

interface Props {

}

interface State {
    loginToken?: string|null;
}

export class DevelopmentNavigation extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        const loginToken = localStorage.getItem('Meteor.loginToken');

        this.state = {
            loginToken,
        };
    }

    public render() {
        const { loginToken } = this.state;

        return (
            <NavigationBar>
                <List horizontal spaced>
                    <ListItem>
                        <MainNavLink to={'/'} exact>
                            part-up
                        </MainNavLink>
                    </ListItem>
                    <ListItem>
                        <MainNavLink to={'/home'}>
                            dashboard
                        </MainNavLink>
                    </ListItem>
                    <ListItem>
                        <MainNavLink to={'/partup-start'}>
                            partup-start
                        </MainNavLink>
                    </ListItem>
                    { loginToken && (
                        <ListItem alignRight>
                            <button type="button" onClick={this.onClickHandler}>clear Meteor.loginToken</button>
                        </ListItem>
                    )}
                    { !loginToken && (
                        <ListItem alignRight>
                            <input type="text" placeholder={'Meteor.loginToken'} onChange={this.onChangeHandler}/>
                        </ListItem>
                    )}
                    <ListItem alignRight>
                        <span style={{ padding: '15px', display: 'block' }}>
                            Partup React Development Environment
                        </span>
                    </ListItem>
                </List>
            </NavigationBar>
        );
    }

    private onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        localStorage.setItem('Meteor.loginToken', event.currentTarget.value);
        window.location.reload();
    }

    private onClickHandler = (event: React.SyntheticEvent<any>) => {
        localStorage.removeItem('Meteor.loginToken');
        window.location.reload();
    }
}
