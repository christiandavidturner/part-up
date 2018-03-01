import { get, flatten } from 'lodash';

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

    const cursors = [boardCursor, laneCursor, activityCursor, contributionCursor, updatesCursor]

    // Files
    const fileIds = flatten(activityCursor.map((activity) => {
      return get(activity, 'files.documents', [])
    }))
    if (fileIds.length) {
      cursors.push(Files.find({ _id: { $in: fileIds}}))
    }

    // Images
    const imageIds = flatten(activityCursor.map((activity) => {
      return get(activity, 'files.images', [])
    }))
    if (imageIds.length) {
      cursors.push(Images.find({ _id: { $in: imageIds}}))
    }

    return cursors

  } else {
    return this.ready();
  }
});
