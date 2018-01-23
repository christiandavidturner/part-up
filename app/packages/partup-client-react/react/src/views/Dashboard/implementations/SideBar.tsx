import * as React from 'react';
import * as PropTypes from 'prop-types';
import { RouteComponentProps, matchPath } from 'react-router';
import { AppContext } from 'App';
import { MediaQuery } from 'components/MediaQuery/MediaQuery';
import { MobileNav } from 'components/MobileNav/MobileNav';
import { List } from 'components/List/List';
import { Link } from 'components/Router/Link';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { DropDown } from 'components/DropDown/DropDown';
import { MenuLink } from 'components/Router/MenuLink';
import { Icon } from 'components/Icon/Icon';
import { ListItem } from 'components/List/ListItem';
import { translate } from 'utils/translate';
import { ConversationsCount } from 'views/Dashboard/implementations/ConversationsCount';
import { InvitesCount } from 'views/Dashboard/implementations/InvitesCount';
import { ActivitiesCount } from 'views/Dashboard/implementations/ActivitiesCount';

interface Props {
    className?: string;
    baseUrl: string;
    navigator: RouteComponentProps<any>;
}

export class SideBar extends React.Component<Props> {

    public static contextTypes = {
        user: PropTypes.object,
    };

    public context: AppContext;

    public render() {
        return (
            <MediaQuery
                query={`(min-width: 800px)`}
                renderMatch={this.renderDesktopNavigation}
                renderNoMatch={this.renderMobileNavigation}
            />
        );
    }

    private renderMobileNavigation = () => {
        const { user } = this.context;
        const { navigator } = this.props;

        const dropDownOptions = this.getMenuLinks().map((link, index) => {
            const match = matchPath(navigator.location.pathname, {
                path: link.to,
            });

            return {
                isActive: (match && match.isExact) || false,
                leftChild: link.icon,
                rightChild: link.counter,
                label: link.label,
                value: link.to,
            };
        });

        return (
            <MobileNav>
                <List horizontal spaced>
                    <ListItem>
                        <Link to={user ? `/profile/${user._id}` : '#'}>
                            <UserAvatar user={user} />
                        </Link>
                    </ListItem>
                    <ListItem stretch>
                        <DropDown
                            options={dropDownOptions}
                            onChange={({ value }) => navigator.history.push(value)}
                        />
                    </ListItem>
                </List>
            </MobileNav>
        );
    }

    private renderDesktopNavigation = () => {
        const { user } = this.context;

        return (
            <List>
                <ListItem>
                    <MenuLink
                        target={'_partup'}
                        to={user ? `/profile/${user._id}` : '#'} icon={<UserAvatar small user={user} />}>
                        { user && user.profile.normalized_name }
                    </MenuLink>
                </ListItem>
                { this.getMenuLinks().map((link, index) => {
                    return (
                        <MenuLink
                            key={index}
                            to={link.to}
                            icon={link.icon}
                            counter={link.counter}
                        >
                            {link.label}
                        </MenuLink>
                    );
                }) }
            </List>
        );
    }

    /**
     * Returns the menu links used in the sidebar.
     */
    private getMenuLinks() {
        const { baseUrl } = this.props;

        return [
            {
                to: `${baseUrl}`,
                icon: <Icon name={'message'} />,
                counter: <ConversationsCount />,
                label: translate('pur-dashboard-side-bar-conversations'),
            },
            {
                to: `${baseUrl}/activities`,
                icon: <Icon name={'chart'} />,
                counter: <ActivitiesCount />,
                label: translate('pur-dashboard-side-bar-activities'),
            },
            {
                to: `${baseUrl}/invites`,
                icon: <Icon name={'person-plus'} />,
                counter: <InvitesCount />,
                label: translate('pur-dashboard-side-bar-invites'),
            },
        ];
    }
}
