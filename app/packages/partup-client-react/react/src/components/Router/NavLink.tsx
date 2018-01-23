import './NavLink.css';

import * as React from 'react';
import { Route } from 'react-router-dom';
import * as PropTypes from 'prop-types';
import * as c from 'classnames';
import { Link } from './Link';
import { TargetType } from 'components/Router/BaseLink';

export interface NavLinkProps {
    className?: string;
    activeClassName?: string;
    onClick?: Function;
    children?: any;
    to?: any;
    leftChild?: any;
    rightChild?: any;
    exact?: boolean;
    strict?: boolean;
    location?: any;
    isActive?: Function;
    target?: TargetType;
}

export class NavLink extends React.Component<NavLinkProps, {}> {

    public static contextTypes = {
        router: PropTypes.object,
    };

    public render() {
        const {
            to,
            exact,
            strict,
            location,
            isActive: getIsActive,
            ...rest,
        } = this.props;
        const path = typeof to === 'object' ? to.pathname : to;
        const escapedPath = path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');

        return (
            <Route
                path={escapedPath}
                exact={exact}
                strict={strict}
                location={location}
                children={({ location: currentLocation, match }) => {
                    const isActive = !!(getIsActive ? getIsActive(match, currentLocation) : match);

                    return (
                        <Link
                            to={to}
                            {...rest}
                            className={
                                isActive ?
                                [ this.getClassNames(), this.getActiveClassNames() ].filter(i => i).join(' ')
                                :
                                this.getClassNames()
                            }
                            />
                    );
                }}
                />
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-NavLink', className, {

        });
    }

    private getActiveClassNames() {
        const { activeClassName } = this.props;

        return c('pur-NavLink--is-active', activeClassName, {

        });
    }
}
