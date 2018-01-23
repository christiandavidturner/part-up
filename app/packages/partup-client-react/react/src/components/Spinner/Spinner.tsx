import './Spinner.css';

import * as React from 'react';
import * as c from 'classnames';
const Spin = require('spin');

interface Props {
    className?: string;
}

export class Spinner extends React.Component<Props, {}> {

    private spin = undefined;

    public componentDidMount() {
        const options = {
            lines: 13,  // The number of lines to draw
            length: 6,  // The length of each line
            width: 2,  // The line thickness
            radius: 6,  // The radius of the inner circle
            corners: 1,  // Corner roundness (0..1)
            rotate: 0,  // The rotation offset
            direction: 1,  // 1: clockwise, -1: counterclockwise
            color: '#000',  // #rgb or #rrggbb
            speed: 1.2,  // Rounds per second
            trail: 60,  // Afterglow percentage
            shadow: false,  // Whether to render a shadow
            hwaccel: false,  // Whether to use hardware acceleration
            className: '', // The CSS class to assign to the spinner
            zIndex: 0,  // The z-index (defaults to 2000000000)
            top: '50%',  // Top position relative to parent in px
            left: '50%',  // Left position relative to parent in px
        };

        new Spin(options).spin(this.spin);
    }

    public render() {
        const { children } = this.props;

        return (
            <div ref={(spin: any) => this.spin = spin} className={this.getClassNames()}>
                {children}
            </div>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-Spinner', className, {

        });
    }
}
