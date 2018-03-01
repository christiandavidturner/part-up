Meteor.startup(function () {
    if (process.env.NODE_ENV.match(/development|staging/)) {
        if (!Boards.find().count()) {

            /* ING Crowd funding */
            Boards.insert({
                '_id': 'VItDJ3O3MpzeiPU5J',
                'partup_id': 'gJngF65ZWyS9f3NDE',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': ['M8yEL4e3zY7Ar4zt0']
            });

            /* ING Semi Secret */
            Boards.insert({
                '_id': 'jMU371tasWnf0RYUh',
                'partup_id': 'ASfRYBAzo2ayYk5si',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': [
                    'M8yEL4e3zY7Ar4zaq',
                    'M8yEL4e3zY7Ar4za2',
                    'M8yEL4e3zY7Ar4za3',
                    'M8yEL4e3zY7Ar4za4'
                ]
            });

            /* ING Super Secret */
            Boards.insert({
                '_id': 'sGrp9AkRSDVwXNZnn',
                'partup_id': 'CJETReuE6uo2eF7eW',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': ['M8yEL4e3zY7Ar4zy0']
            });

            /* Organize Meteor board */
            Boards.insert({
                '_id': '9TEcgO45TkVBizotA',
                'partup_id': 'vGaxNojSerdizDPjb',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': ['M8yEL4e3zY7Ar4ze0']
            });
            /* Incubator board */
            Boards.insert({
                '_id': 'Gzmun04TtYiP8llQ1',
                'partup_id': 'IGhBN2Z3mrA90j3g7',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': ['M8yEL4e3zY7Ar4zr0']
            });
            /* Partup developement board */
            Boards.insert({
                '_id': 'vGaxNojSerdizDPj0',
                'partup_id': 'vGaxNojSerdizDPjd',
                'created_at': new Date(),
                'updated_at': new Date(),
                'lanes': [
                    'M8yEL4e3zY7Ar4zwq',
                    'M8yEL4e3zY7Ar4zw2',
                    'M8yEL4e3zY7Ar4zw3',
                    'M8yEL4e3zY7Ar4zw4'
                ]
            });




        }
    }
});
