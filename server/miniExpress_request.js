var url = require("url");
var querystring = require("querystring");
var middlewares = require("./miniExpress_middlewares");
var fileExtensionsToContentType = require("./miniHttp_constants").fileExtensionsToContentType;

function Request(clientRequest) {
    var that = this;

    // Take attributes from the given clientRequest instance
    for (prop in clientRequest) {
        this[prop] = clientRequest[prop];
    }
    
    this.params = {};
    this.query = getQuery(clientRequest);
    this.cookies = getCookies(clientRequest);
    this.path = getPath(clientRequest);
    this.host = getHostName(clientRequest);
    this.protocol = getProtocol(clientRequest);
    this.route = {};
    
    // Get the case-insensitive request header field.
    this.get = function (field) {
        field = field.toLowerCase();
        switch (field) {
        case 'referer':
        case 'referrer':
            return that.headers.referrer || that.headers.referer;
        default:
            return that.headers[field];
        }
    };
    
    // Lookup is performed in the following order: req.params -> req.body -> req.query
    this.param = function (name) {
        return that.params[name] || that.body[name] || that.query[name];
    };
    
    this.is = function (type) {
        var contentType = that.get("content-type");
        if (!contentType) {
            return false;
        }
        
        if (type.indexOf("/") === -1) {
            type = fileExtensionsToContentType[type];
            if (!type) {
                return false;
            }
        }
        
        if (type.indexOf("*") !== -1) {
            type = type.split("/");
            contentType = contentType.split("/");
            
            // If type is of the form */<subtype> and contentType == <subtype>
            if (type[0] === "*" && type[1] === contentType[1]) {
                return true;
            }
            
            // If type is of the form <type>/* and contentType[type] = type
            if (type[1] === "*" && type[0] === contentType[0]) {
                return true;
            }
            
            return false;
        }
        
        return !(contentType.indexOf(type) === -1);
    };

    this.setRoute = function (callbackRouteObj) {
        that.route = callbackRouteObj;
        
        // Get params object
        var params = {};
        var keysValues = that.route.regexp.exec(that.url).slice(2);
        for (i = 0; i < that.route.keys.length; i++) {
            if (keysValues[i]) {
                params[that.route.keys[i].name] = keysValues[i];
            }
        }
        
        that.params = params;
    };
}

// Private module functions
function getHostName(clientRequest) {
    var hostHeader = clientRequest.headers.host;
    if (!hostHeader || hostHeader.indexOf(":") === -1) {
        // Illegal host header
        return "";
    }
    return hostHeader.substr(0, hostHeader.indexOf(":"));
}

function getProtocol(clientRequest) {
    var httpVersion = clientRequest.httpVersion;
    if (!httpVersion || httpVersion.indexOf("/") === -1) {
        // Illegal http version
        return "";
    }
    return httpVersion.substr(0, httpVersion.indexOf("/"));
}

function getPath(clientRequest) {
    var requestUrl = clientRequest.url;
    return url.parse(requestUrl).pathname;
}

// If the user is using the cookieParser middleware, returns {}, otherwise, returns the cookies sent by the user-agent.
function getCookies(clientRequest) {
    if (middlewares.cookieParser.isBeingUsed) {
        return {};
    } else {
        return clientRequest.headers.cookie;
    }
}

function getQuery(clientRequest) {
    var requestUrl = clientRequest.url;
    var query = querystring.parse(url.parse(requestUrl).query, "&");
    
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
    return query;
}

module.exports = Request;