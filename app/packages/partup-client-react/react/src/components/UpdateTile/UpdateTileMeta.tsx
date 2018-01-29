import './UpdateTileMeta.css';

import * as React from 'react';
import * as c from 'classnames';
import * as moment from 'moment';
import { ConversationUpdateDocument } from 'collections/Updates';
import { SystemAvatar } from 'components/Avatar/SystemAvatar';
import { UserAvatar } from 'components/Avatar/UserAvatar';
import { Users, UserDocument } from 'collections/Users';
import { Partups, PartupDocument } from 'collections/Partups';
import { PartupAvatar } from 'components/Avatar/PartupAvatar';
import { BaseLink } from 'components/Router/BaseLink';

interface Props {
    className?: string;
    update: ConversationUpdateDocument;
}

export class UpdateTileMeta extends React.Component<Props, {}> {
    private partup: PartupDocument;

    public componentWillMount() {
      const { update } = this.props;
      this.partup = Partups.findOneAny({ _id: update.partup_id }) as PartupDocument;
    }

    public render() {
        const { update, children } = this.props;
        const { created_at, partup_id } = update;
        const partupSlug = Partups.getSlugById(partup_id);

        return (
            <div className={this.getClassNames()}>
                <div className={`pur-UpdateTileMeta__author-avatar`}>
                    {this.getAvatar()}
                </div>
                <div className={`pur-UpdateTileMeta__pur-UpdateTileMeta__info`}>
                    <BaseLink
                        target={'_partup'}
                        to={`/partups/${partupSlug}/updates/${update._id}`}
                        className={`pur-UpdateTileMeta__created-info`}>
                        {children}
                    </BaseLink>
                    <br/>
                    <time
                        className={`pur-UpdateTileMeta__created-at`}
                        dateTime={created_at.toString()}
                    >
                        { moment(created_at).format('H:mm ddd MMMM YYYY') }
                    </time>
                    <BaseLink
                      target={'_partup'}
                      to={`/partups/${partupSlug}`}
                      className={'pur-UpdateTileMeta__title'}>
                        {this.partup.name}
                    </BaseLink>
                </div>
            </div>
        );
    }

    private getAvatar() {
        const { update } = this.props;

        if (update.system) {
            return <SystemAvatar />;
        }

        if (update.upper_id) {
            const user = (Users.findOneAny({ _id: update.upper_id }) as UserDocument);
            return <UserAvatar user={user} />;
        }

        const partup = Partups.findOneAny({ _id: update.partup_id }) as PartupDocument;

        return <PartupAvatar partup={partup} />;
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-UpdateTileMeta', className, {

        });
    }
}
