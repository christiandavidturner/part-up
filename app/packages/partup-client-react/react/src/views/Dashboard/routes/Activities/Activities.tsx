import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { ContentView } from 'components/View/ContentView';
import { FilteredListItems } from 'components/FilteredList/FilteredListItems';
import { FilteredList } from 'components/FilteredList/FilteredList';
import { FilteredListControls } from 'components/FilteredList/FilteredListControls';
import { Select } from 'components/Form/Select';
import { Blank } from 'components/FillInTheBlanks/Blank';
import { ActivityTile } from 'components/ActivityTile/ActivityTile';
import { FilteredListSection } from 'components/FilteredList/FilteredListSection';
import { Icon } from 'components/Icon/Icon';
import { Button } from 'components/Button/Button';
import { Subscriber } from 'utils/Subscriber';
import { Meteor } from 'utils/Meteor';

interface Props extends RouteComponentProps<any> {
    //
}

export class ActivitiesView extends React.Component<Props> {

    private activitiesSubscriber = new Subscriber({
        subscription: 'activities.me',
        onChange: () => this.forceUpdate(),
    });

    public async componentWillMount() {
        await this.activitiesSubscriber.subscribe();
        console.log(Meteor.collection('activities').find())
    }

    public render() {

        return (
            <ContentView>

                <Button
                    leftChild={<Icon name={'chart'} />}>
                    Nieuwe activiteit
                </Button>

                <FilteredList>
                    <FilteredListControls>
                        <Blank label={'Toon'}>
                            <Select options={[
                                { label: 'Actief', value: 'filterByAll', onChange: () => console.log('filterByAll') },
                                { label: 'Partner', value: 'filterByPartner', onChange: () => console.log('filterByPartner') },
                                { label: 'Supporter', value: 'filterBySupporter', onChange: () => console.log('filterBySupporter') },
                            ]} />
                        </Blank>
                    </FilteredListControls>
                    <FilteredListItems hasSubSections>
                        <FilteredListSection title={`This week`}>
                            <ActivityTile />
                        </FilteredListSection>
                        <FilteredListSection title={`Next week`}>
                            <ActivityTile />
                        </FilteredListSection>
                        <FilteredListSection title={`Later`}>
                            <ActivityTile />
                        </FilteredListSection>
                    </FilteredListItems>
                </FilteredList>
            </ContentView>
        );
    }
}
