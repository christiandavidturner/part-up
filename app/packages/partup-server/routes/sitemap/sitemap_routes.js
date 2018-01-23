/*
 * Main sitemap route
 */
Router.route('/sitemap.xml', { where: 'server' }).get(function() {
    var response = this.response;
    var baseUrl = 'https://part-up.com/';

    // Main XML sitemap generation starts here
    var xml = '<sitemapindex xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">';

    xml += '<sitemap>';
    xml += '<loc>' + baseUrl + 'default.xml</loc>';
    xml += '</sitemap>';

    xml += '<sitemap>';
    xml += '<loc>' + baseUrl + 'tribes.xml</loc>';
    xml += '</sitemap>';

    xml += '<sitemap>';
    xml += '<loc>' + baseUrl + 'part-ups.xml</loc>';
    xml += '</sitemap>';

    xml += '<sitemap>';
    xml += '<loc>' + baseUrl + 'profiles.xml</loc>';
    xml += '</sitemap>';

    xml += '<sitemap>';
    xml += '<loc>' + baseUrl + 'swarms.xml</loc>';
    xml += '</sitemap>';

    xml += '</sitemapindex>';

    // We are going to respond in XML format
    response.setHeader('Content-Type', 'application/xml');

    return response.end(xml);
});

/*
 * Default sitemap route
 */
Router.route('/default.xml', { where: 'server' }).get(function() {
    var response = this.response;
    response.setHeader('Content-Type', 'application/xml');

    var baseUrl = 'https://part-up.com/';
    var xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Set homepage
    xml += '<url>';
    xml += '<loc>' + baseUrl + '</loc>';
    xml += '<changefreq>daily</changefreq>';
    xml += '<priority>1.0</priority>';
    xml += '</url>';

    xml += '</urlset>';

    return response.end(xml);
});

/*
 * Network sitemap route
 */
Router.route('/tribes.xml', { where: 'server' }).get(function() {
    var response = this.response;
    response.setHeader('Content-Type', 'application/xml');
    var xml = getSitemap('tribes.xml');

    return response.end(xml.Body.toString());
});

/*
 * Part-ups sitemap route
 */
Router.route('/part-ups.xml', { where: 'server' }).get(function() {
    var response = this.response;
    response.setHeader('Content-Type', 'application/xml');
    var xml = getSitemap('part-ups.xml');

    return response.end(xml.Body.toString());
});

/*
 * Profiles sitemap route
 */
Router.route('/profiles.xml', { where: 'server' }).get(function() {
    var response = this.response;
    response.setHeader('Content-Type', 'application/xml');
    var xml = getSitemap('profiles.xml');

    return response.end(xml.Body.toString());
});

/*
 * Swarms sitemap route
 */
Router.route('/swarms.xml', { where: 'server' }).get(function() {
    var response = this.response;
    response.setHeader('Content-Type', 'application/xml');
    var xml = getSitemap('swarms.xml');

    return response.end(xml.Body.toString());
});

/*
 * Retrieve sitemap from S3
 */
function getSitemap(key) {
    return S3.getObjectSync({ Key: key });
}