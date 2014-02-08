var miniHttp = require("./miniHttp");
var request = require("./miniExpress_request");
var response = require("./miniExpress_response");

function next() {
    var i;
    for (i = currentHandlerIndex + 1; i < app.stack.length; i++) {
        // Skip if necessary
        if (!app.stack[i].regexp.test(currentRequest.url)) {
            continue;
        }
        currentHandlerIndex = i;
        
        // Populate request's route object
        currentRequest.setRoute(app.stack[i]);
        
        // Invoke handler
        app.stack[i].callback(currentRequest, currentResponse, next);
        
        // Uninitialize params
        currentRequest.params = {};
        break;
    }
}

function app(clientRequest, serverResponse) {    
    currentRequest = new request(clientRequest);
    currentResponse = new response(serverResponse);
    
    // In case of an un-handled exception, send error 500
    try {
        next();
        if (!currentResponse.sent) {
            currentResponse.writeError(404);
        }
    } catch (e) {
        console.log("Unhandled error (%s) in app callback. Sending error 500", e.message);
        currentResponse.writeError(500);
    }
    
    // Uninitialize private members
    currentRequest = undefined;
    currentResponse = undefined;
    currentHandlerIndex = -1;
};

// Starts listening to the given port
app.listen = function (port, callback) {
    var server = miniHttp.createServer(app);
    server.listen(port, callback);
    return server;
};

// route is optional (Default value is '/')
app.use = function (route, requestHandler) {
    if (!requestHandler) {
        requestHandler = route;
        route = "/";
    }
    try {
        routeObj = parseRoute(route);
    } catch (e) {
        console.log("Failed assigning middleware: " + e.message);
        return;
    }
    // Add the requestHandler callback to the route data model
    app.stack.push({
        path        :   routeObj.path,
        callback    :   requestHandler,
        keys        :   routeObj.keys,
        regexp      :   routeObj.regexp
    });
};

app.get = function (route, requestHandler) {    
    useByMethod("get", route, requestHandler);
}

app.post = function (route, requestHandler) {
    useByMethod("post", route, requestHandler);
}

app.delete = function (route, requestHandler) {
    useByMethod("delete", route, requestHandler);
}

app.put = function (route, requestHandler) {
    useByMethod("put", route, requestHandler);
}

app.route = {
    "get"    : [],
    "post"   : [],
    "delete" : [],
    "put"    : []
};
app.stack = [];

// Private variables for the module
var currentHandlerIndex = -1;
var currentRequest;
var currentResponse;

// route is optional
function useByMethod(method, route, requestHandler) {
    // This method can only be used by the methods app.get(), app.post(), app.delete() and app.put()
    if (["get", "post", "delete", "put"].indexOf(method) === -1) {
        throw new Error("Unknown VERB");
    }
    
    // Fix arguments, if necessary
    if (!requestHandler) {
        requestHandler = route;
        route = "/";
    }
    
    var routeObj;
    
    try {
        routeObj = parseRoute(route);
    } catch (e) {
        console.log("Failed assigning middleware: " + e.message);
        return;
    }
    
    // Add the requestHandler callback to the route data model
    app.route[method].push({
        path        :   routeObj.path,
        method      :   method,
        callback    :   requestHandler,
        keys        :   routeObj.keys,
        regexp      :   routeObj.regexp
    });
    
    app.use(route, function (req, res, next) {
        if (req.method === method) {
            requestHandler(req, res, next);
        } else {
            next();
        }
    });   
}

function parseRoute(route) {
    var path = route;
    var keys = [];
    var key;
    route = route.split("/");
    
    // Sanity check: The first element in route should be the empty string (Beacse route must start with /)
    if (route[0]) {
        throw new Error("Illegal route");
    } else {
        delete route[0];
    }
    
    // In case the route ends with /, remove it.
    if (!route[route.length - 1]) {
        delete route[route.length - 1];
    }
    
    for (i in route) {
        // Check if the current element is a key
        if (route[i].indexOf(":") !== -1) {
            key = (/^:(.+?)(\?)?$/i).exec(route[i]);
            if (!key || !key[1]) {
                throw new Error("Illegal parameter (%s) in route", route[i]);
            }
            var isOptional = (key[2] === "?");
            keys.push({
                name: key[1],
                optional: isOptional
            });
            // Replace the key name by a proper regexp
            route[i] = "(?:\\/([^\\/]+))";
            if (isOptional) {
                route[i] += "?";
            }
        } else {
            route[i] = "\\/" + route[i];
        }
    }
    var regexp = new RegExp("^(" + route.join("") + ")(?:\\/.*)?", "i");
    
    return {
        "path": path,
        "keys": keys,
        "regexp": regexp
    };
}

module.exports = app;