import _ from 'lodash';

const onedrivePickerConfig = {
    clientId: 'a8ab6cd2-327e-4325-ba30-198c4d620278',
    action: 'query',
    multiSelect: true,
};

const successCallback = async (files) => {
    console.log(files);
};

const errorCallback = async (error) => console.log(error);

const open = () => {
    OneDrive.open({
        ...onedrivePickerConfig,
        success: successCallback,
        error: errorCallback,
        // cancel: '',
    });
};

Template.onedrivePicker.onRendered(function() {
    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error(
            'onedrivePicker: cannot operate without a FileController'
        );
    }

    this.$trigger = $('[data-browse-onedrive');
    if (!this.$trigger) {
        throw new Error(
            'onedrivePicker: expected to find an html element with the "data-browse-onedrive" attribute'
        );
    }

    this.$trigger.on('click', open);
});

Template.onedrivePicker.onDestroyed(function() {
    this.$trigger.off('click', open);
});
