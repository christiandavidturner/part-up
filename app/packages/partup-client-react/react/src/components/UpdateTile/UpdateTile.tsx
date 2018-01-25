import './UpdateTile.css';

import * as React from 'react';
import * as c from 'classnames';
import { ConversationUpdateDocument } from 'collections/Updates';
import { ChangedRegion } from 'components/Update/ChangedRegion';
import { ContributionAccepted } from 'components/Update/ContributionAccepted';
import { ContributionAdded } from 'components/Update/ContributionAdded';
import { ContributionChanged } from 'components/Update/ContributionChanged';
import { ContributionCommentAdded } from 'components/Update/ContributionCommentAdded';
import { ContributionProposed } from 'components/Update/ContributionProposed';
import { ContributionRemoved } from 'components/Update/ContributionRemoved';
import { NetworkPrivate } from 'components/Update/NetworkPrivate';
import { NetworkPublic } from 'components/Update/NetworkPublic';
import { PartupActivityAdded } from 'components/Update/PartupActivityAdded';
import { PartupActivityArchived } from 'components/Update/PartupActivityArchived';
import { PartupActivityChanged } from 'components/Update/PartupActivityChanged';
import { PartupActivityCommentAdded } from 'components/Update/PartupActivityCommentAdded';
import { PartupActivityRemoved } from 'components/Update/PartupActivityRemoved';
import { PartupActivityUnarchived } from 'components/Update/PartupActivityUnarchived';
import { PartupArchived } from 'components/Update/PartupArchived';
import { PartupBudgetChanged } from 'components/Update/PartupBudgetChanged';
import { PartupCommentAdded } from 'components/Update/PartupCommentAdded';
import { PartupCreated } from 'components/Update/PartupCreated';
import { PartupDescriptionChanged } from 'components/Update/PartupDescriptionChanged';
import { PartupEndDateChanged } from 'components/Update/PartupEndDateChanged';
import { PartupImageChanged } from 'components/Update/PartupImageChanged';
import { PartupInvited } from 'components/Update/PartupInvited';
import { PartupLocationChanged } from 'components/Update/PartupLocationChanged';
import { PartupMessageAdded } from 'components/Update/PartupMessageAdded';
import { PartupNameChanged } from 'components/Update/PartupNameChanged';
import { PartupPartnerRejected } from 'components/Update/PartupPartnerRejected';
import { PartupPartnerRequest } from 'components/Update/PartupPartnerRequest';
import { PartupRatingChanged } from 'components/Update/PartupRatingChanged';
import { PartupRatingInserted } from 'components/Update/PartupRatingInserted';
import { PartupSupporterAdded } from 'components/Update/PartupSupporterAdded';
import { PartupTagAdded } from 'components/Update/PartupTagAdded';
import { PartupTagChanged } from 'components/Update/PartupTagChanged';
import { PartupTagRemoved } from 'components/Update/PartupTagRemoved';
import { PartupUnarchived } from 'components/Update/PartupUnarchived';
import { PartupUpperAdded } from 'components/Update/PartupUpperAdded';
import { Rated } from 'components/Update/Rated';
import { SystemSupporterRemoved } from 'components/Update/SystemSupporterRemoved';
import { UpdateTileMeta } from 'components/UpdateTile/UpdateTileMeta';
import { UpdateTileContent } from 'components/UpdateTile/UpdateTileContent';
import { UpdateTileComments } from 'components/UpdateTile/UpdateTileComments';
import { translate } from 'utils/translate';
import { Partups, PartupDocument } from 'collections/Partups';
import { Users, UserDocument } from 'collections/Users';
import { Icon } from 'components/Icon/Icon';

interface Props {
    className?: string;
    update: ConversationUpdateDocument;
    isStarred?: boolean;
    hideComments?: boolean;
}

export class UpdateTile extends React.Component<Props, {}> {

    public render() {
        const {
            update,
            isStarred,
            hideComments,
        } = this.props;

        return (
            <div className={this.getClassNames()}>
                {isStarred && (
                    <Icon name={`recommended`} className={`pur-UpdateTile__starred-icon`} />
                )}
                <UpdateTileMeta update={update}>
                    { this.renderUpdateTitle(update, this.getPosterName()) }
                </UpdateTileMeta>
                { this.shouldRenderUpdateComponent(update) && (
                    <UpdateTileContent>
                        { this.renderUpdateComponent(update) }
                    </UpdateTileContent>
                )}
                {this.shouldRenderUpdateComments(update) && (
                    <UpdateTileComments
                        update={update}
                        hideComments={hideComments}
                        redirectCommentIntent
                    />
                )}
            </div>
        );
    }

    private getPosterName() {
        const { update, isStarred } = this.props;

        if (update.upper_id) {
            return (Users.findOneAny({ _id: update.upper_id }) as UserDocument).profile.name;
        }

        return isStarred || update.system ? 'Part-up' : (Partups.findOneAny({ _id: update.partup_id }) as PartupDocument).name;
    }

    private getClassNames() {
        const { className, isStarred } = this.props;

        return c('pur-UpdateTile', className, {
            'pur-UpdateTile--is-starred': isStarred,
        });
    }

    private shouldRenderUpdateComments(update: any) {
        const isContribution = update.type.includes('partups_contributions_');
        return !(update.system || isContribution);
    }

    private shouldRenderUpdateComponent({ type }: {type: string}) {
        return {
            changed_region:                       () => true,
            partups_contributions_accepted:       () => true,
            partups_contributions_added:          () => true,
            partups_contributions_changed:        () => true,
            partups_contributions_comments_added: () => true,
            partups_contributions_proposed:       () => true,
            partups_contributions_removed:        () => true,
            network_private:                      () => true,
            network_public:                       () => true,
            partups_activities_added:             () => true,
            partups_activities_archived:          () => true,
            partups_activities_changed:           () => true,
            partups_activities_comments_added:    () => true,
            partups_activities_removed:           () => true,
            partups_activities_unarchived:        () => true,
            partups_archived:                     () => false, // no update content
            partups_budget_changed:               () => true,
            partups_comments_added:               () => false, // no update content
            partups_created:                      () => false, // no update content
            partups_description_changed:          () => true,
            partups_end_date_changed:             () => true,
            partups_image_changed:                () => true,
            partups_invited:                      () => false, // no update content
            partups_location_changed:             () => true,
            partups_message_added:                () => true,
            partups_name_changed:                 () => true,
            partups_partner_rejected:             () => true,
            partups_partner_request:              () => false,
            partup_partner_request:               () => false,
            partups_ratings_changed:              () => true,
            partups_ratings_inserted:             () => true,
            partups_supporters_added:             () => false, // no update content
            partups_tags_added:                   () => true,
            partups_tags_changed:                 () => true,
            partups_tags_removed:                 () => true,
            partups_unarchived:                   () => false, // no update content
            partups_uppers_added:                 () => false, // no update content
            rated:                                () => true,
            system_supporters_removed:            () => true,
        }[type]();
    }

    private renderUpdateComponent({ type, ...update }: {type: string, type_data: {[key: string]: any}}) {

        const table = {
            changed_region:                       (data: ConversationUpdateDocument) => <ChangedRegion data={data} />,
            partups_contributions_accepted:       (data: ConversationUpdateDocument) => <ContributionAccepted data={data} />,
            partups_contributions_added:          (data: ConversationUpdateDocument) => <ContributionAdded data={data} />,
            partups_contributions_changed:        (data: ConversationUpdateDocument) => <ContributionChanged />,
            partups_contributions_comments_added: (data: ConversationUpdateDocument) => <ContributionCommentAdded />,
            partups_contributions_proposed:       (data: ConversationUpdateDocument) => <ContributionProposed />,
            partups_contributions_removed:        (data: ConversationUpdateDocument) => <ContributionRemoved />,
            network_private:                      (data: ConversationUpdateDocument) => <NetworkPrivate />,
            network_public:                       (data: ConversationUpdateDocument) => <NetworkPublic />,
            partups_activities_added:             (data: ConversationUpdateDocument) => <PartupActivityAdded data={data} />,
            partups_activities_archived:          (data: ConversationUpdateDocument) => <PartupActivityArchived data={data} />,
            partups_activities_changed:           (data: ConversationUpdateDocument) => <PartupActivityChanged data={data} />,
            partups_activities_comments_added:    (data: ConversationUpdateDocument) => <PartupActivityCommentAdded data={data} />,
            partups_activities_removed:           (data: ConversationUpdateDocument) => <PartupActivityRemoved data={data} />,
            partups_activities_unarchived:        (data: ConversationUpdateDocument) => <PartupActivityUnarchived data={data} />,
            partups_archived:                     (data: ConversationUpdateDocument) => <PartupArchived data={data} />, // no update content
            partups_budget_changed:               (data: ConversationUpdateDocument) => <PartupBudgetChanged />,
            partups_comments_added:               (data: ConversationUpdateDocument) => <PartupCommentAdded />, // no update content
            partups_created:                      (data: ConversationUpdateDocument) => <PartupCreated data={data} />, // no update content
            partups_description_changed:          (data: ConversationUpdateDocument) => <PartupDescriptionChanged data={data} />,
            partups_end_date_changed:             (data: ConversationUpdateDocument) => <PartupEndDateChanged data={data} />,
            partups_image_changed:                (data: ConversationUpdateDocument) => <PartupImageChanged data={data} />,
            partups_invited:                      (data: ConversationUpdateDocument) => <PartupInvited data={data} />, // no update content
            partups_location_changed:             (data: ConversationUpdateDocument) => <PartupLocationChanged />,
            partups_message_added:                (data: ConversationUpdateDocument) => <PartupMessageAdded data={data} />,
            partups_name_changed:                 (data: ConversationUpdateDocument) => <PartupNameChanged data={data} />,
            partups_partner_rejected:             (data: ConversationUpdateDocument) => <PartupPartnerRejected />,
            partups_partner_request:              (data: ConversationUpdateDocument) => <PartupPartnerRequest />,
            partup_partner_request:               (data: ConversationUpdateDocument) => <PartupPartnerRequest />,
            partups_ratings_changed:              (data: ConversationUpdateDocument) => <PartupRatingChanged />,
            partups_ratings_inserted:             (data: ConversationUpdateDocument) => <PartupRatingInserted />,
            partups_supporters_added:             (data: ConversationUpdateDocument) => <PartupSupporterAdded data={data} />, // no update content
            partups_tags_added:                   (data: ConversationUpdateDocument) => <PartupTagAdded data={data} />,
            partups_tags_changed:                 (data: ConversationUpdateDocument) => <PartupTagChanged data={data} />,
            partups_tags_removed:                 (data: ConversationUpdateDocument) => <PartupTagRemoved data={data} />,
            partups_unarchived:                   (data: ConversationUpdateDocument) => <PartupUnarchived data={data} />, // no update content
            partups_uppers_added:                 (data: ConversationUpdateDocument) => <PartupUpperAdded data={data} />, // no update content
            rated:                                (data: ConversationUpdateDocument) => <Rated />,
            system_supporters_removed:            (data: ConversationUpdateDocument) => <SystemSupporterRemoved />,
        };

        return table[type](update);
    }

    private renderUpdateTitle({ type, type_data }: {type: string, type_data: {[key: string]: any}}, upperName: string) {

        const map = {
            changed_region:                       (postee: any) => translate('update-type-changed_region-title', { name: postee }),
            network_private:                      (postee: any) => translate('update-type-network_private-title', { name: postee }),
            network_public:                       (postee: any) => translate('update-type-network_public-title', { name: postee }),
            partups_activities_added:             (postee: any) => translate('update-type-partups_activities_added-title', { name: postee }),
            partups_activities_archived:          (postee: any) => translate('update-type-partups_activities_archived-title', { name: postee }),
            partups_activities_changed:           (postee: any) => translate('update-type-partups_activities_changed-title', { name: postee }),
            partups_activities_comments_added:    (postee: any) => translate('update-type-partups_activities_comments_added-title', { name: postee }),
            partups_activities_removed:           (postee: any) => translate('update-type-partups_activities_removed-title', { name: postee }),
            partups_activities_unarchived:        (postee: any) => translate('update-type-partups_activities_unarchived-title', { name: postee }),
            partups_archived:                     (postee: any) => translate('update-type-partups_archived-title', { name: postee }),
            partups_budget_changed:               (postee: any) => translate('update-type-partups_budget_changed-title', { name: postee }),
            partups_comments_added:               (postee: any) => translate('update-type-partups_comments_added-title', { name: postee }),
            partups_contributions_accepted:       (postee: any) => translate('update-type-partups_contributions_accepted-title', { name: postee }),
            partups_contributions_added:          (postee: any) => translate('update-type-partups_contributions_added-title', { name: postee }),
            partups_contributions_changed:        (postee: any) => translate('update-type-partups_contributions_changed-title', { name: postee }),
            // tslint:disable-next-line
            partups_contributions_comments_added: (postee: any) => translate('update-type-partups_contributions_comments_added-title', { name: postee }),
            partups_contributions_proposed:       (postee: any) => translate('update-type-partups_contributions_proposed-title', { name: postee }),
            partups_contributions_removed:        (postee: any) => translate('update-type-partups_contributions_removed-title', { name: postee }),
            partups_created:                      (postee: any) => translate('update-type-partups_created-title', { name: postee }),
            partups_description_changed:          (postee: any) => translate('update-type-partups_description_changed-title', { name: postee }),
            partups_end_date_changed:             (postee: any) => translate('update-type-partups_end_date_changed-title', { name: postee }),
            partups_image_changed:                (postee: any) => translate('update-type-partups_image_changed-title', { name: postee }),
            partups_invited:                      (postee: any) => translate('update-type-partups_invited-title', { name: postee }),
            partups_location_changed:             (postee: any) => translate('update-type-partups_location_changed-title', { name: postee }),
            partups_message_added:                (postee: any) => translate('update-type-partups_message_added-title', { name: postee }),
            partups_name_changed:                 (postee: any) => translate('update-type-partups_name_changed-title', { name: postee }),
            partups_partner_rejected:             (postee: any) => translate('update-type-partups_partner_rejected-title', { name: postee }),
            partups_partner_request:              (postee: any) => translate('update-type-partups_partner_request-title', { name: postee }),
            partups_ratings_changed:              (postee: any) => translate('update-type-partups_ratings_changed-title', { name: postee }),
            partups_ratings_inserted:             (postee: any) => translate('update-type-partups_ratings_inserted-title', { name: postee }),
            partups_supporters_added:             (postee: any) => translate('update-type-partups_supporters_added-title', { name: postee }),
            partups_tags_added:                   (postee: any) => translate('update-type-partups_tags_added-title', { name: postee }),
            partups_tags_changed:                 (postee: any) => translate('update-type-partups_tags_changed-title', { name: postee }),
            partups_tags_removed:                 (postee: any) => translate('update-type-partups_tags_removed-title', { name: postee }),
            partups_unarchived:                   (postee: any) => translate('update-type-partups_unarchived-title', { name: postee }),
            partups_uppers_added:                 (postee: any) => translate('update-type-partups_uppers_added-title', { name: postee }),
            rated:                                (postee: any) => translate('update-type-rated-title', { name: postee }),
            system_supporters_removed:            (postee: any) => translate('update-type-system_supporters_removed-title', { name: postee }),
        };

        return map[type](upperName, type_data);
    }
}
