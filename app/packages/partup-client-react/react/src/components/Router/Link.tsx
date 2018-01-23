import './Link.css';

import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as c from 'classnames';
import { BaseLink, TargetType } from 'components/Router/BaseLink';

interface Props {
    className?: string;
    children?: any;
    onClick?: Function;
    to?: any;
    leftChild?: any;
    rightChild?: any;
    target?: TargetType;
}

export class Link extends React.Component<Props, {}> {

    public static contextTypes = {
        router: PropTypes.object,
    };

    public render() {
        const {
            leftChild,
            children,
            rightChild,
            ...passProps,
        } = this.props;

        return (
            <BaseLink
                {...passProps}
                className={this.getClassNames()}
                onClick={this.onClick}>
                { leftChild && (
                    <span className={`pur-Link__left-child`}>
                        { leftChild }
                    </span>
                ) }
                { children && (
                    <span className={`pur-Link__content`}>
                        { children }
                    </span>
                ) }
                { rightChild && (
                    <span className={`pur-Link__right-child`}>
                        { rightChild }
                    </span>
                ) }
            </BaseLink>
        );
    }

    private onClick = (event: React.SyntheticEvent<any>) => {
        const { onClick, to, target } = this.props;
        const { router } = this.context;

        if (!target) {
            event.preventDefault();
            router.history.push(to);
        }

        if (onClick) onClick(event);
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-Link', className, {

        });
    }
}
