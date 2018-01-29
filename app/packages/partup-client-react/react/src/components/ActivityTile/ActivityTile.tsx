import './ActivityTile.css';

import * as moment from 'moment';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as c from 'classnames';
import { Link } from 'components/Router/Link';
import { Icon } from 'components/Icon/Icon';
import { PopoverMenu } from 'components/PopoverMenu/PopoverMenu';
import { ParticipantAvatars } from 'components/ParticipantAvatars/ParticipantAvatars';
import { ActivityDocument } from 'collections/Activities';
import { Partups, PartupDocument } from 'collections/Partups';
import { Contributions } from 'collections/Contributions';
import { UserDocument, Users } from 'collections/Users';
import { Meteor } from 'utils/Meteor';
import { AppContext } from 'App';
import { PortalManager } from 'components/PortalManager/PortalManager';
import { ModalPortal } from 'components/Modal/ModalPortal';
import { Form } from 'components/Form/Form';
import { ModalWindow } from 'components/Modal/ModalWindow';
import { ModalHeader } from 'components/Modal/ModalHeader';
import { ModalContent } from 'components/Modal/ModalContent';
import { FieldCollection } from 'components/Form/FieldCollection';
import { FieldSet } from 'components/Form/FieldSet';
import { Label } from 'components/Form/Label';
import { Input } from 'components/Form/Input';
import { ModalFooter } from 'components/Modal/ModalFooter';
import { List } from 'components/List/List';
import { ListItem } from 'components/List/ListItem';
import { Button } from 'components/Button/Button';
import { translate } from 'utils/translate';

interface Props {
    className?: string;
    activity: ActivityDocument;
    onChange: () => void;
}

export class ActivityTile extends React.Component<Props, {}> {

    public static contextTypes = {
        user: PropTypes.object,
    };

    public context: AppContext;

    private partup: PartupDocument | undefined;
    private contributers: UserDocument[] | undefined;

    public componentWillMount() {
        const { activity } = this.props;

        this.partup = Partups.findOneStatic({ _id: activity.partup_id });

        this.contributers = Contributions.findStatic({ activity_id: activity._id })
            .map(({ upper_id }) => Users.findOneStatic({ _id: upper_id }))
            .reverse() as UserDocument[]; // Reverse the array because the row is reversed in css.
    }

    public render() {
        const { activity } = this.props;

        const partupSlug = Partups.getSlugById(activity.partup_id);

        const menuLinks = [
          !activity.archived ? (
            <Link
              key={1}
              onClick={this.archiveActivity}>
                {translate('pur-dashboard-activity_tile-link-archive')}
            </Link>
            ) : (
            <Link
              key={1}
              onClick={this.unarchiveActivity}>
                {translate('pur-dashboard-activity_tile-link-unarchive')}
            </Link>
            ),
          <Link
            key={2}
            to={`/partups/${partupSlug}/invite-for-activity/${activity._id}`}
            target={`_partup`}>
              {translate('pur-dashboard-activity_tile-link-invite')}
          </Link>,
          <Link
            key={3}
            to={`/partups/${partupSlug}/updates/${activity.update_id}`}
            target={`_partup`}
            >
                {translate('pur-dashboard-activity_tile-link-comment')}
          </Link>,
          this.renderEditModalLink(),
        ];

        return (
            <div className={this.getClassNames()}>
                <header className={`pur-ActivityTile__header`}>
                    <Link
                        to={`/partups/${partupSlug}/updates/${activity.update_id}`}
                        target={`_partup`}
                        className={`pur-ActivityTile__title`}
                    >
                        {activity.name}
                    </Link>
                    <div className={`pur-ActivityTile__meta-info`}>
                        <time className={`pur-ActivityTile__timestamp`}>
                            { activity.end_date ? (
                                moment(activity.end_date).format('D MMMM YYYY')
                            ) : (translate('pur-dashboard-activity_tile-no-date'))}
                        </time>
                        <span className={`pur-ActivityTile__seperator`}>{` | `}</span>
                        <Link
                            to={`/partups/${partupSlug}`}
                            target={`_partup`}
                            className={`pur-ActivityTile__partup-link`}
                        >
                            {this.partup && this.partup.name}
                        </Link>
                    </div>
                </header>
                <PopoverMenu className={`pur-ActivityTile__menu`} items={menuLinks}>
                    <Icon name={'menu'} />
                </PopoverMenu>
                <div className={`pur-ActivityTile__participants`}>
                    <ParticipantAvatars participants={this.contributers ? this.contributers.slice(0, 5) : []} />
                </div>
            </div>
        );
    }

    private renderEditModalLink = () => {
        const { activity } = this.props;

        return (
            <PortalManager
                renderHandler={(open) => (
                    <Link
                        key={5}
                        // leftChild={<Icon name={'pencil'} />}
                        onClick={open}
                    >
                        {translate('pur-dashboard-activity_tile-link-edit')}
                    </Link>
                )}
                renderPortal={(close) => (
                    <ModalPortal onBackgroundClick={close}>

                        <Form onSubmit={(e: any, fields: any) => {
                            // tslint:disable-next-line:no-console
                            window.console.log(fields);
                        }}>
                            <ModalWindow>
                                <ModalHeader
                                    onClose={close}
                                    title={translate('pur-dashboard-activity_tile-edit_modal-title', { activity: activity.name })} />
                                <ModalContent>
                                    <FieldCollection>
                                        <FieldSet>
                                            <Label label={'Field label'}>
                                                <Input type={'text'} name={'fieldname'} />
                                            </Label>
                                        </FieldSet>
                                    </FieldCollection>
                                </ModalContent>
                                <ModalFooter>
                                    <List horizontal>
                                        <ListItem alignRight>
                                            <Button type={'button'} onClick={close}>
                                                {translate('pur-dashboard-activity_tile-edit_modal-cancel_button')}
                                            </Button>
                                        </ListItem>
                                        <ListItem alignRight>
                                            <Button type={'submit'}>
                                                {translate('pur-dashboard-activity_tile-edit_modal-submit_button')}
                                            </Button>
                                        </ListItem>
                                    </List>
                                </ModalFooter>
                            </ModalWindow>
                        </Form>
                    </ModalPortal>
                )}
            />
        );
    }

    private archiveActivity = () => {
        const { activity: { _id }, onChange } = this.props;

        Meteor.call('activities.archive', _id);
        onChange();
    }

    private unarchiveActivity = () => {
        const { activity: { _id }, onChange } = this.props;

        Meteor.call('activities.unarchive', _id);
        onChange();
    }

    private getClassNames() {
        const { className } = this.props;

        return c('pur-ActivityTile', {
            // 'pur-ActivityTile--modifier-class': boolean,
        }, className);
    }
}
