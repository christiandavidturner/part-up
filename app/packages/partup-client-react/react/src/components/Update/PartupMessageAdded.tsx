import './PartupMessageAdded.css';

import * as React from 'react';
import * as c from 'classnames';
import { translate } from 'utils/translate';
import { get } from 'lodash';
import { UpdateDocument } from 'collections/Updates';
import { UpdateText } from 'components/TextRenderer/UpdateText';
import { Documents } from 'components/Documents/Documents';
import { ImageGallery } from 'components/ImageGallery/ImageGallery';

interface Props {
    className?: string;
    data: UpdateDocument;
}

export class PartupMessageAdded extends React.Component<Props, {}> {

    public render() {
        return (
            <div className={this.getClassNames()}>
                { this.renderContent() }
            </div>
        );
    }

    private renderContent() {
        const { type_data } = this.props.data;

        if (type_data.type === 'welcome_message') {
            return translate('update-type-partups_message_added-system-welcome_message-content');
        }

        return (
            <React.Fragment>
                <UpdateText text={get(type_data, 'new_value')} />
                {type_data.images && type_data.images.length && (
                    <ImageGallery images={type_data.images} />
                ) }
                {type_data.documents && type_data.documents.length && (
                    <Documents documents={type_data.documents} />
                ) }
            </React.Fragment>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-PartupMessageAdded', className, {

        });
    }
}
