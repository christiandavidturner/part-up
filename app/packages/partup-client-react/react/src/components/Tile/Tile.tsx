import './Tile.css';

import * as React from 'react';
import * as c from 'classnames';

interface Props {
    title?: string;
    subTitle?: string;
    className?: string;
}

export class Tile extends React.Component<Props, {}> {

    public render() {
        const {
            children,
            title,
            subTitle,
        } = this.props;

        return (
            <div className={this.getClassNames()}>
                {title && <h4 className={`pur-Tile__title`} dangerouslySetInnerHTML={{ __html: `<span>${title}</span>` }}/>}
                <div className={`pur-Tile__content`}>
                    { children }
                </div>
                {subTitle && <p className={`pur-Tile__subtitle`}>{subTitle}</p>}
            </div>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-Tile', className, {

        });
    }
}
