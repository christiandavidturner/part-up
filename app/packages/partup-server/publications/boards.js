import { get } from 'lodash';

Meteor.publish('board.for_partup_id', function(partupId) {
  check(partupId, String);
  this.unblock();

  var partup = Partups.guardedFind(this.userId, { _id: partupId }).fetch().pop();
  if (get(partup, 'board_id')) {

    const boardCursor = Boards.find({ partup_id: partupId }, { limit: 1 });
    const laneCursor = Lanes.find({ board_id: partup.board_id });
    const activityCursor = Activities.find({ partup_id: partupId });
    const updatesCursor = Updates.find({ partup_id: partupId, 'type_data.activity_id': { $exists: true } });
    const contributionCursor = Contributions.find({ partup_id: partupId });

    return [boardCursor, laneCursor, activityCursor, contributionCursor, updatesCursor];
  } else {
    return this.ready();
  }
});
