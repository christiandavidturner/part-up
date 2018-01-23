import * as React from 'react';
import * as PropTypes from 'prop-types';
import { AppContext } from 'App';
import { Images, ImageDocument } from 'collections/Images';
import { Partups, PartupDocument } from 'collections/Partups';
import { Fetcher, mergeDataByKey } from 'utils/Fetcher';
import { FilteredList } from 'components/FilteredList/FilteredList';
import { FilteredListControls } from 'components/FilteredList/FilteredListControls';
import { FillInTheBlanks } from 'components/FillInTheBlanks/FillInTheBlanks';
import { Blank } from 'components/FillInTheBlanks/Blank';
import { Select } from 'components/Form/Select';
import { FilteredListItems } from 'components/FilteredList/FilteredListItems';
import { Spinner } from 'components/Spinner/Spinner';
import { InfiniteScroll } from 'components/InfiniteScroll/InfiniteScroll';
import { Tile } from 'components/Tile/Tile';
import { UpdateTile } from 'components/UpdateTile/UpdateTile';
import { Subscriber } from 'utils/Subscriber';
import { Users, UserDocument } from 'collections/Users';
import { Activities, ActivityDocument } from 'collections/Activities';
import { Lanes, LaneDocument } from 'collections/Lanes';
import { Updates, UpdateDocument, ConversationUpdateDocument } from 'collections/Updates';
import { DropDown } from 'components/DropDown/DropDown';
import { PartupAvatar } from 'components/Avatar/PartupAvatar';
import { translate } from 'utils/translate';
import { Tracker } from 'utils/Tracker';
import { NewIndicator } from 'components/Indicator/NewIndicator';
// import { Counter } from 'components/Counter/Counter';

interface FetcherResponse {
    'cfs.images.filerecord': ImageDocument[];
    partups: PartupDocument[];
    users: UserDocument[];
    activities: ActivityDocument[];
    lanes: LaneDocument[];
    updates: UpdateDocument[];
}

interface Props {
    onNewIndicatorClick?: Function;
}

interface State {
    newConversationUpdates: number;
    newUpdatesBoundary: Date;
}

export class ConversationUpdates extends React.Component<Props, State> {

    public static contextTypes = {
        user: PropTypes.object,
    };

    public context: AppContext;

    public state: State = {
        newConversationUpdates: 0,
        newUpdatesBoundary: new Date(),
    };

    private filters: {[key: string]: any} = {};

    private skip = 0;
    private fetchedAll = false;

    private conversationsFetcher = new Fetcher<FetcherResponse, {conversationUpdates: ConversationUpdateDocument[]}>({
        route: 'partups/updates',
        query: {
            limit: 20,
            skip: 0,
        },
        onChange: () => this.forceUpdate(),
        onResponse: (data) => {
            const {
                'cfs.images.filerecord': images = [],
                partups = [],
                users = [],
                activities = [],
                lanes = [],
                updates = [],
            } = data;

            Images.updateStatics(images);
            Partups.updateStatics(partups);
            Users.updateStatics(users);
            Activities.updateStatics(activities);
            Lanes.updateStatics(lanes);
            Updates.updateStatics(updates);
            this.subscribeToUpdateComments();
        },
        transformData: (data) => {
            const {
                updates = [],
            }: {
                updates: UpdateDocument[],
            } = data;

            const conversationUpdates = updates.map((update: UpdateDocument) => {
                return {
                    activity: Activities.findOneStatic({ update_id: update._id }) || {},
                    upper: Users.findOneStatic({ _id: update.upper_id }) || {},
                    ...update,
                };
            }) as ConversationUpdateDocument[];

            return {
                conversationUpdates,
            };
        },
    });

    private partupsFetcher = new Fetcher({
        route: 'partups/me',
        onChange: () => this.forceUpdate(),
    });

    private updatesCommentsSubscriber = new Subscriber({
        subscription: 'updates.comments_by_update_ids',
        onStateChange: () => this.forceUpdate(),
    });

    private newUpdatesSubscriber = new Subscriber({
        subscription: 'updates.new_conversations',
    });

    private updateTracker = new Tracker<UpdateDocument>({
        collection: 'partups',
        onChange: (event) => {
            const { newUpdatesBoundary } = this.state;

            const user = Users.findLoggedInUser();

            if (!user) return;

            const partups = Partups.find({
                upper_data: {
                    $elemMatch: {
                        _id: user._id,
                        new_updates: { $exists: true, $not: { $size: 0 } },
                    },
                },
            });

            const updateIds = new Set(
                partups.map(({ upper_data }) => {
                    const upperData = upper_data.find(({ _id }) => _id === user._id);

                    return upperData ? upperData.new_updates : [];
                }).reduce((x, y) => x.concat(y), []),
            );

            const updates = Updates.find({
                _id: { $in: Array.from(updateIds) },
                updated_at: { $gte: newUpdatesBoundary },
            });

            if (updates.length) {
                this.setState({
                    newConversationUpdates: updates.length,
                });
            }
        },
    });

    public subscribeToUpdateComments = async () => {
        const updateIds = Updates.findStatic().map((update: UpdateDocument) => update._id);

        await this.updatesCommentsSubscriber.subscribe(updateIds, { system: false });
    }

    public componentWillMount() {
        const { newUpdatesBoundary } = this.state;
        this.conversationsFetcher.fetch();
        this.partupsFetcher.fetch();
        this.newUpdatesSubscriber.subscribe({ dateFrom: newUpdatesBoundary });
    }

    public componentWillUnmount() {
        this.conversationsFetcher.destroy();
        this.updateTracker.destroy();
        this.partupsFetcher.destroy();
        this.updatesCommentsSubscriber.destroy();
        this.newUpdatesSubscriber.destroy();
    }

    public render() {
        const { data, loading } = this.conversationsFetcher;
        const { data: partupsData } = this.partupsFetcher;
        const { conversationUpdates = [] } = data;
        const { partups = [] } = partupsData;
        const { newConversationUpdates } = this.state;

        const partupOptions = this.getPartupOptions(partups);

        return (
            <FilteredList>
                <FilteredListControls>
                    <FillInTheBlanks>
                        <Blank label={translate('pur-dashboard-conversations-filter_by_partup_type_label')}>
                            <Select options={[
                                {
                                    label: translate('pur-dashboard-conversations-filter_all_type_label'),
                                    value: 'filterByAll',
                                    onChange: () => this.filterBy('filterByAll'),
                                },
                                {
                                    label: translate('pur-dashboard-conversations-filter_partner_type_label'),
                                    value: 'filterByPartner',
                                    onChange: () => this.filterBy('filterByPartner'),
                                },
                                {
                                    label: translate('pur-dashboard-conversations-filter_supporter_type_label'),
                                    value: 'filterBySupporter',
                                    onChange: () => this.filterBy('filterBySupporter'),
                                },
                            ]} />
                        </Blank>
                        <Blank label={translate('pur-dashboard-conversations-filter_blank_seperator')}>
                            <DropDown
                                options={[
                                    { label:
                                        translate('pur-dashboard-conversations-filter_all_partups_label'),
                                        value: 'all',
                                        isActive: true,
                                    },
                                    ...partupOptions,
                                ]}
                                onChange={(option) => this.filterByPartup(option.value)}
                            />
                        </Blank>
                    </FillInTheBlanks>
                </FilteredListControls>
                <FilteredListItems>
                    { newConversationUpdates > 0 && (
                        <NewIndicator
                            onClick={this.onNewIndicatorClick}>
                            { `${newConversationUpdates} nieuwe update(s)` }
                        </NewIndicator>
                    ) }
                    { loading && (!conversationUpdates.length || newConversationUpdates === 0) && (
                        <Spinner />
                    ) }
                    <InfiniteScroll loadMore={this.loadMore}>
                        { (conversationUpdates || []).map((update: ConversationUpdateDocument) => {
                            const partup = Partups.findOneStatic({ _id: update.partup_id }) || { name: '' };

                            return (
                                <Tile title={partup.name} key={update._id}>
                                    <UpdateTile update={update} />
                                </Tile>
                            );
                        }) }
                    </InfiniteScroll>
                </FilteredListItems>
            </FilteredList>
        );
    }

    private onNewIndicatorClick = (event: React.SyntheticEvent<any>) => {
        const { onNewIndicatorClick } = this.props;

        this.setState({
            newConversationUpdates: 0,
            newUpdatesBoundary: new Date(),
        });

        this.conversationsFetcher.fetch();

        if (onNewIndicatorClick) onNewIndicatorClick(event);
    }

    private filterBy(type: 'filterByAll' | 'filterByPartner' | 'filterBySupporter') {
        this.skip = 0;
        this.fetchedAll = false;

        const options = {
            filterByAll: false,
            filterByPartner: false,
            filterBySupporter: false,
            [type]: true,
        };

        this.filters = {
            ...this.filters,
            supporterOnly: !options.filterByAll && options.filterBySupporter,
            upperOnly: !options.filterByAll && options.filterByPartner,
        };

        this.conversationsFetcher.fetch(this.filters);
    }

    private filterByPartup(partupId: string) {
        this.skip = 0;
        this.fetchedAll = false;

        if (partupId === 'all' && this.filters.partupId) {
            delete this.filters.partupId;
        } else if (partupId !== 'all') {
            this.filters = {
                ...this.filterBy,
                partupId: partupId,
            };
        }

        this.conversationsFetcher.fetch(this.filters);
    }

    private loadMore = async (done: Function) => {
        if (this.fetchedAll) {
            return;
        }

        this.skip = this.skip + 20;

        await this.conversationsFetcher.fetchMore({
            ...this.filters,
            skip: this.skip,
        }, mergeDataByKey('updates', () => {
            this.fetchedAll = true;
        }));

        done();
    }

    private getPartupOptions(partups: PartupDocument[]) {
        const user = this.context.user as UserDocument;

        return partups.filter(({ _id }) => {
            if (!this.context.user || (!this.filters.supporterOnly && !this.filters.upperOnly)) {
                return true;
            }

            if (this.filters.supporterOnly) {
                return this.context.user.supporterOf.includes(_id);
            }

            if (this.filters.upperOnly) {
                return this.context.user.upperOf.includes(_id);
            }

            return false;
        }).map((partup) => {

            let amountOfUpdates = 0;
            if (partup.upper_data && partup.upper_data.length) {
                const upperData = partup.upper_data.find(({ _id }) => _id === user._id);

                if (upperData) {
                    amountOfUpdates = upperData.new_updates.length;
                }
            }

            return {
                leftChild: <PartupAvatar partup={partup} />,
                // rightChild: <Counter highlighted count={amountOfUpdates} />,
                label: partup.name,
                isActive: false,
                value: partup._id,
            };
        });
    }
}
