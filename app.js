/**
 * Module dependencies.
 */
var path = require('path');
var config_file = path.join(__dirname, 'config.json');
var config = require('./config.js');
var getXml = function (req) {

    var parseString = require('xml2js').parseString;

    config.init(config_file, function (resp) {
        if (resp != 0) {
            console.log('Could not load config file.');
            return;
        }

        var pageData = "";

        var options = config.snap_url;
        getSnapBuild();

        function getSnapBuildDetails(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                pageData += chunk;
            });
            res.on('end', function () {
                options = config.go_url;
                getGoBuild();
            });
        }

        function getGoBuildDetails(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                pageData += chunk;
            });
            res.on('end', function () {
                pageData = pageData.replace('\n</Projects>\n<?xml version="1.0" encoding="utf-8"?>\n<Projects>', "")
                console.log(pageData);
                parseString(pageData, {trim: true}, function (err, result) {
                    req.io.emit('talk', {
                        message: result
                    });
                });
            });
        }

        function getSnapBuild() {
            https.get(options, getSnapBuildDetails).on('error', function (e) {
                console.log('ERROR: ' + e.message);
            });
        }

        function getGoBuild() {
            http.get(options, getGoBuildDetails).on('error', function (e) {
                console.log('ERROR: ' + e.message);
            });
        }

    });

}

var express = require('express.io')
    , routes = require('./routes')
    , user = require('./routes/user')
    , https = require('https')
    , http = require('http')
    , path = require('path');

var app = express();

app.http().io();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);

app.io.route('tray', function (req) {

    getXml(req);
    setInterval(function () {
        getXml(req);

    }, 5000);
});


app.server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});