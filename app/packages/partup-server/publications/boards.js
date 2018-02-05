Meteor.publishComposite('board.for_partup_id', function(partupId) {
    check(partupId, String);
    this.unblock();
    var partup = Partups.findOne(partupId);

    const self = this;
    Slogger.write({
      action: 'board.for_partup_id',
      type: 'composite publication',
      data: {
        self
      },
    });

    return {
        find: function() {
            return Boards.findForPartup(partup, this.userId);
        }, children: [
            {find: Lanes.findForBoard}
        ]
    };
});
