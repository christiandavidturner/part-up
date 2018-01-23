Package.describe({
    name: 'partup-client-boardview',
    version: '0.0.1',
    summary: '',
    documentation: null,
});

Package.onUse(function(api) {
    api.use(['templating', 'partup-lib', 'ecmascript'], 'client');

    api.addFiles(['Sortable.js', 'BoardView.html', 'BoardView.js'], 'client');
});
