var url = Npm.require('url');
var userApiAccessToken = process.env.USER_API_ACCESS_TOKEN;

// Disable all default response headers (we want to control them manually)
JsonRoutes.setResponseHeaders({});

// Enable caching for a couple of different endpoints
JsonRoutes.Middleware.use(function(request, response, next) {
    var urlRegexesToCacheForAnHour = [
        /\/networks\/[a-zA-Z0-9-]+$/, // /networks/lifely-open
        /\/partups\/by_ids\/[a-zA-Z0-9,]+$/, // /partups/by_ids/vGaxNojSerdizDPjb
        /\/partups\/discover??((?!userId).)*$/, // /partups/discover?query (only if userId is not present)
        /\/partups\/discover\/count??((?!userId).)*$/, // /partups/discover/count?query (only if userId is not present)
        /\/partups\/home\/[a-zA-Z]+$/, // /partups/home/en
        /\/users\/count$/, // /users/count
    ];

    var cacheControl = 'no-store, max-age=0';

    urlRegexesToCacheForAnHour.forEach(function(regex) {
        if (regex.test(request.url)) {
            cacheControl = 'public, max-age=3600';
        }
    });

    response.setHeader('Cache-Control', cacheControl);

    next();
});


if (userApiAccessToken) {
    // This allows the User API to directly access 
    JsonRoutes.Middleware.use(function(request, response, next) {
        // If the authorization header matches with the set USER_API_ACCESS_TOKEN it is a request
        // via the User API. We then set the userId in the request object to the authenticated user
        // to enable the calling of Meteor methods.
        if (userApiAccessToken && request.headers.authorization === userApiAccessToken) {
            request.userId = request.headers['x-authenticated-userid'];
        }

        // Otherwise just proceed as a normal request
        next();
    });
}

JsonRoutes.Middleware.use(JsonRoutes.Middleware.parseBearerToken);
JsonRoutes.Middleware.use(JsonRoutes.Middleware.authenticateMeteorUserByToken);