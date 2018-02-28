
Template.documentRenderer.onCreated(function() {
  this.autorun(() => {
    this.subscribe('files.many', this.data.documents);
  })
});

Template.documentRenderer.helpers({
    files() {
        return Files.find({ _id: { $in: this.documents } });
    },
    getSvgIcon(file) {
        return Partup.helpers.files.getSvgIcon(file);
    },
    bytesToSize(bytes) {
        return Partup.helpers.files.binaryToShortSize(bytes);
    },
});
