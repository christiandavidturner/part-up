import './StarredUpdates.css';

import * as React from 'react';
import * as c from 'classnames';
import { ConversationUpdateDocument } from 'collections/Updates';
import { UpdateTile } from 'components/UpdateTile/UpdateTile';
import { translate } from 'utils/translate';

interface Props {
    className?: string;
    updates: ConversationUpdateDocument[];
}

interface State {}

export class StarredUpdates extends React.Component<Props, State> {
    public render() {
        const { updates } = this.props;

        return (
            <div className={this.getClassNames()}>
                <h4 className={`pur-StarredUpdates__title`}>
                    {translate('pur-partup-start-starred-updates_title')}
                </h4>

                {updates.length ? (
                    updates.map((update) => (
                        <UpdateTile
                            key={update._id}
                            hideComments
                            isStarred
                            update={update}
                        />
                    ))
                ) : (
                    <p>
                        {translate('pur-partup-start-starred-updates_no-starred')}
                    </p>
                )}
            </div>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c(
            'pur-StarredUpdates',
            {
                // 'pur-StarredUpdates--modifier-class': boolean,
            },
            className,
        );
    }
}
