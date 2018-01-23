import './BaseLink.css';

import * as React from 'react';
import * as c from 'classnames';

export type TargetType = '_blank' | '_self' | '_parent' | '_top' | '_partup';

interface Props {
    className?: string;
    children?: any;
    onClick?: Function;
    to?: any;
    target?: TargetType;
}

interface State {}

export class BaseLink extends React.Component<Props, State> {

    public render() {
        const {
            children,
        } = this.props;

        return (
            <a
                target={this.getTarget()}
                href={this.getHref()}
                className={this.getClassNames()}
                onClick={this.onClick}>
                {children}
            </a>
        );
    }

    private onClick = (event: React.SyntheticEvent<any>) => {
        const { onClick } = this.props;

        if (onClick) onClick(event);
    }

    private getHref() {
        const { to, target } = this.props;

        if (target === '_partup') return to;

        return '#';
    }

    private getTarget() {
        const { target } = this.props;

        if (target === '_partup') return undefined;

        return target;
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-BaseLink', {
            // '-BaseLink--modifier-class': boolean,
        }, className);
    }
}
