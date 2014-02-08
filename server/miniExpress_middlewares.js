var querystring = require("querystring");
var path = require("path");

function static(rootFolder) {
    if (!rootFolder) {
        throw new Error('static() root path required');
    }
    rootFolder = path.normalize(rootFolder);
    
    return function (req, res, next) {
        if ('get' !== req.method) {
            next();
            return;
        }
        
        var requestedResourceURL = req.path.replace(/%20/g,' ');
        res.resourcePath = path.normalize(requestedResourceURL.replace(req.route.regexp.exec(requestedResourceURL)[1], rootFolder));

        // Check if the resource is under the root folder
        if (path.relative(rootFolder, res.resourcePath).indexOf("..") === 0) {
            res.send(404, "Illegal resource (Not under root folder)");
            return;
        }
        
        res.writeFile();
    };
};

function cookieParser() {
    cookieParser.isBeingUsed = true;
    return function (req, res, next) {
        var cookieHeader = req.get("cookie");
        
        if (cookieHeader) {
            req.cookies = querystring.parse(cookieHeader, /\s*;\s*/);
        }
        
        if (next) {
            next();
        }
    };
}
cookieParser.isBeingUsed = false;

function json() {
    return function (req, res, next) {
        if (req.is("json")) {
            req.body = JSON.parse(req.body);
        }
        
        if (next) {
            next();
        }
    }
}

function urlencoded() {
    return function (req, res, next) {
        if (req.is('application/x-www-form-urlencoded')) {
            var body = req.body;
            var query = querystring.parse(body, "&");
            
            // Keys can be in the format of objName[propName]. This loop searches for such keys, if found the keys get replaced by the proper object.
            for (key in query) {
                var keyInfo = /^(.+)\[(.+)\]$/.exec(key);
                if (keyInfo != null) {
                    var objName = keyInfo[1];
                    var properyName = keyInfo[2];
                    if (!(objName in query)) {
                        query[objName] = {};
                    }
                    query[objName][properyName] = query[key];
                    
                    delete query[key];
                }
            }
            
            req.body =  query;
        }
        
        if (next) {
            next();
        }
    }
}

function bodyParser() {
    return function (req, res, next) {
        // we don't pass next cause we don't want them to call next
        json()(req, res);
        urlencoded()(req, res);
        
        if (next) {
            next();
        }
    }
}

exports.static = static;
exports.cookieParser = cookieParser;
exports.json = json;
exports.urlencoded = urlencoded;
exports.bodyParser = bodyParser;