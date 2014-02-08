var app = require("./miniExpress_app");
var middlewares = require("./miniExpress_middlewares");

var miniExpress = function () {
    return app;
};

miniExpress.static = middlewares.static;
miniExpress.cookieParser = middlewares.cookieParser;
miniExpress.json = middlewares.json;
miniExpress.urlencoded = middlewares.urlencoded;
miniExpress.bodyParser = middlewares.bodyParser;

// This will enable calling the miniExpress function right after requiring this module
module.exports = miniExpress;