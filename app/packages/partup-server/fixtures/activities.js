Meteor.startup(function() {
    if (process.env.NODE_ENV.match(/development|staging/)) {

        if (!Activities.find().count()) {

            //first activity
            Activities.insert({
                '_id' : 'ruvTupX9WMmqFTLuL',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'name' : 'crowd funding platform selectie',
                'description' : 'kickstarter wellicht?',
                'lane_id' : 'hUGKnG6VRqFfuXtch',
                'creator_id' : 'K5c5M4Pbdg3B82wQH',
                'created_at' : new Date('2015-07-21T14:03:49.139Z'),
                'update_id' : 'rqAFPrKayDd8Ko6YK',
                'updated_at' : new Date('2015-07-21T14:03:49.139Z'),
                'end_date' : new Date('2016-04-21T00:00:00.000Z'),
                'archived' : false
            });

            Activities.insert({
                '_id' : 'ruvTupX9WMmqFTLwL',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'name' : 'crowd funding platformen onderzoek',
                'description' : 'kickstarter wellicht?',
                'lane_id' : 'hUGKnG6VRqFfuXtch',
                'creator_id' : 'K5c5M4Pbdg3B82wQH',
                'created_at' : new Date('2015-07-21T14:03:49.139Z'),
                'update_id' : 'rqAFPrKayDd8Ko6YK',
                'updated_at' : new Date('2015-07-21T14:03:49.139Z'),
                'end_date' : new Date('2016-04-21T00:00:00.000Z'),
                'archived' : false
            });

            // Second activity
            Activities.insert({
                '_id' : 'SYwR9AHWc7AKsfMrv',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'name' : 'communicatie campagne bedenken',
                'description' : null,
                'lane_id' : 'WFcjbTeEDeiY5XC9N',
                'creator_id' : 'K5c5M4Pbdg3B82wQH',
                'created_at' : new Date('2015-07-21T14:03:57.905Z'),
                'update_id' : 'hvL6bnH5ckaA599d4',
                'updated_at' : new Date('2015-07-21T14:03:57.905Z'),
                'end_date' : null,
                'archived' : false
            });
        }
    }
});
