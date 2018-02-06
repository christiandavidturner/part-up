import _ from 'lodash';

const drivePickerConfig = {
    developerKey: 'AIzaSyAN_WmzOOIcrkLCobAyUqTTQPRtAaD8lkM',
    clientId:
        '963161275015-ktpmjsjtr570htbmbkuepthb1st8o99o.apps.googleusercontent.com',
    scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
    ],
};

drivePicker = drivePicker || {};

Template.drivePicker.onRendered(function() {
    const template = this;
    let accessToken;

    this.controller = this.data.controller;
    if (!this.controller) {
        throw new Error('drivePicker: cannot operate without a FileController');
    }

    const $trigger = $('[data-browse-drive]');
    if (!$trigger) {
        throw new Error(
            'drivePicker: expected to find a html element with the "data-browse-drive" attribute'
        );
    }

    function pickerCallback(data) {
        const uploadPromises = [];

        if (
            data[google.picker.Response.ACTION] === google.picker.Action.PICKED
        ) {
            // Files first need to be transformed in order for canAdd to work.
            const transformedFiles = _.map(
                data.docs,
                Partup.helpers.files.transform.googledrive
            );
            const files = template.controller.canAdd(
                transformedFiles,
                (removedFile) => {
                    const category = Partup.client.files.isImage(removedFile)
                        ? 'images'
                        : 'files';
                    Partup.client.notify.info(
                        TAPi18n.__('upload-info-limit-reached', {
                            category,
                            filename: removedFile.name,
                        })
                    );
                    _.remove(data.docs, (d) => d.name === removedFile.name);
                }
            );

            template.controller.uploading.set(true);

            _.each(files, (file) => {
                const uploadPromise = template.controller
                    .insertFileToCollection(file)
                    .then((inserted) =>
                        template.controller.addFilesToCache(inserted)
                    )
                    .catch((error) => {
                        Partup.client.notify.error(
                            TAPi18n.__(`upload-error-${error.code}`)
                        );
                    });

                uploadPromises.push(uploadPromise);
            });

            Promise.all(uploadPromises)
                .then(() => template.controller.uploading.set(false))
                .catch((error) => {
                    throw error;
                });
        }
    }

    function createPicker(accessToken) {
        if (accessToken) {
            const personalView = new google.picker.DocsView();
            personalView.setIncludeFolders(true);

            const teamView = new google.picker.DocsView();
            teamView.setIncludeFolders(true);
            teamView.setEnableTeamDrives(true);

            const pickerBuilder = new google.picker.PickerBuilder();

            pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
            pickerBuilder.enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES);

            pickerBuilder.addView(personalView);
            pickerBuilder.addView(teamView);
            pickerBuilder.addView(new google.picker.DocsUploadView());

            pickerBuilder.setOAuthToken(accessToken);
            pickerBuilder.setCallback(pickerCallback);

            pickerBuilder.setSize(
                $(document).outerWidth(),
                $(document).outerHeight()
            );

            const picker = pickerBuilder.build();
            picker.setVisible(true);
        }
    }

    function open() {
        const token = window.gapi.auth.getToken();
        if (token) {
            createPicker(token.access_token);
        } else {
            window.gapi.auth.authorize(
                {
                    client_id: drivePickerConfig.clientId,
                    scope: drivePickerConfig.scope,
                    immediate: false,
                },
                (result) => {
                    if (result && !result.error) {
                        accessToken = result.access_token;
                    }
                    createPicker(accessToken);
                }
            );
        }
    }

    Promise.all(
        ['auth', 'picker', 'client'].map(
            (api) =>
                new Promise((resolve) => {
                    window.gapi.load(api, {
                        callback() {
                            resolve(api);
                        },
                    });
                })
        )
    ).then(() => {
        window.gapi.client.load('drive', 'v3', () => {
            $trigger.off('click', open);
            $trigger.on('click', open);
        });
    });
});
