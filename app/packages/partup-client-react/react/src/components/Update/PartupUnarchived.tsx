import './PartupUnarchived.css';

import * as React from 'react';
import * as c from 'classnames';

interface Props {
    className?: string;
    data: any;
}

export class PartupUnarchived extends React.Component<Props, {}> {

    public render() {
        return (
            <div className={this.getClassNames()}>
                {`no-update-available`}
            </div>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-PartupUnarchived', className, {

        });
    }
}
