Meteor.startup(function() {
    if (process.env.NODE_ENV.match(/development|staging/)) {

        if (!Contributions.find().count()) {
            //First partup
            /* 1 */
            Contributions.insert({
                '_id' : 'TtC4Dnbo4CSdTLR9L',
                'hours' : 10,
                'rate' : 50,
                'created_at' : new Date('2015-03-26T16:25:07.816Z'),
                'activity_id' : 'ruvTupX9WMmqFTLwL',
                'upper_id' : 'q63Kii9wwJX3Q6rHS',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'verified' : true,
                'update_id' : 'FzvicjkgyXPiYTqbs',
                'updated_at' : new Date('2015-03-26T16:25:07.816Z')
            });

            /* 2 */
            Contributions.insert({
                '_id' : 'JbXCzb82hqm4Bjwze',
                'hours' : null,
                'rate' : null,
                'created_at' : new Date('2015-03-26T16:25:07.816Z'),
                'activity_id' : 'ruvTupX9WMmqFTLwL',
                'upper_id' : 'q63Kii9wwJX3Q6rHS',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'verified' : false,
                'update_id' : '38mpZCcjpS8vBA8Ys'
            });

            /* 3 */
            Contributions.insert({
                '_id' : 'yZ42ydeKrXCfGsjXo',
                'hours' : null,
                'rate' : null,
                'created_at' : new Date('2015-07-21T14:09:28.473Z'),
                'activity_id' : 'ruvTupX9WMmqFTLuL',
                'upper_id' : 'K5c5M4Pbdg3B82wQI',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'verified' : true,
                'update_id' : '5BDYurmbYkiFbNho4'
            });

            /* 4 */
            Contributions.insert({
                '_id' : '4GggDMBiHz44afReM',
                'hours' : null,
                'rate' : null,
                'created_at' : new Date('2015-07-21T14:11:51.956Z'),
                'activity_id' : 'SYwR9AHWc7AKsfMrv',
                'upper_id' : 'a7qcp5RHnh5rfaeW9',
                'partup_id' : 'gJngF65ZWyS9f3NDE',
                'verified' : false,
                'update_id' : 'AttwbATkJYcTeNtHz'
            });
        }
    }
});
