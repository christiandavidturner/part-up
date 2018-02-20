Meteor.publishComposite('board.for_partup_id', function(partupId) {
    check(partupId, String);
    this.unblock();
    var partup = Partups.findOne(partupId);

    return {
        find() {
            return Boards.findForPartup(partup, this.userId);
        }, children: [
            {find: Lanes.findForBoard},
            {find: () => Activities.find({ partup_id: partupId, deleted_at: { $ne: true } })},
        ]
    };
});
