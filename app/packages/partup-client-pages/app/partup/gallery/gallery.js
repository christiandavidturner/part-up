Template.ImageGallery.onCreated(function() {
    var template = this;
    this.loading = new ReactiveVar(true);

    const imageIds = Template.instance().data.images
    this.subscribe('images.many', imageIds, {
        onReady: () => {
          this.loading.set(false);
        }
    })
});
Template.ImageGallery.helpers({
    popupId: function() {
        return this.updateId + '_gallery';
    },
    singleImage: function() {
        return Template.instance().data.images.length === 1;
    },
    loading() {
        return Template.instance().loading.get();
    }
});

Template.ImageGallery.events({
    'click [data-open-gallery]': function(event, template) {
        var popupId = $(event.currentTarget).data('open-gallery');
        var imageId = $(event.target).closest('[data-image]').data('image');
        Partup.client.popup.open({
            id: popupId,
            type: 'gallery',
            imageIndex: this.images.indexOf(imageId),
            totalImages: this.images.length
        });

    }
});
