import './ImageGallery.css';

import * as React from 'react';
import * as c from 'classnames';
import { Images } from 'collections/Images';

interface Props {
    className?: string;
    images: string[];
}

interface State {}

export class ImageGallery extends React.Component<Props, State> {

    public render() {
        const { images } = this.props;

        return (
            <ul className={this.getClassNames()}>
                {images.map(imageId => {

                    const image = Images.findOneAny({ _id: imageId }, {}, true);

                    if (images.length === 1) {
                        const imageUrl = Images.getUrl(image, '1200x520');
                        return (
                            <li key={imageId} data-image={imageId}>
                                <a href={imageUrl} rel="noopener" target="_blank">
                                    <figure style={{ backgroundImage: `url(${imageUrl})` }} />
                                </a>
                            </li>
                        );
                    }

                    const imageUrl = Images.getUrl(image, '360x360');
                    return (
                        <li key={imageId} data-image={imageId}>
                            <a href={imageUrl} rel="noopener" target="_blank">
                                <figure style={{ backgroundImage: `url(${imageUrl})` }} />
                            </a>
                        </li>
                    );
                })}
            </ul>
        );
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-ImageGallery', 'pu-updateimages', 'pu-updateimages', {
            // 'pur-ImageGallery--modifier-class': boolean,
        }, className);
    }
}
