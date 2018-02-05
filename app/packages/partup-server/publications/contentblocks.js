Meteor.publishComposite('contentblocks.by_network_slug', function(networkSlug) {
  const self = this;
    Slogger.write({
      action: 'contentblocks.by_network_slug',
      type: 'composite publication',
      data: {
        self
      },
    });
    check(networkSlug, String);

    this.unblock();

    return {
        find: function() {
            return Networks.guardedFind(this.userId, {slug: networkSlug}, {limit: 1});
        },
        children: [
            {
                find: function(network) {
                    return ContentBlocks.find({_id: {$in: network.contentblocks || []}});
                },
                children: [
                    {find: Images.findForContentBlock}
                ]
            }
        ]
    };
});
