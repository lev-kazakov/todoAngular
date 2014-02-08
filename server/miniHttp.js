var net = require("net");
var parser = require("./miniHttp_parser");
var ClientRequest = require("./miniHttp_ClientRequest");
var ServerResponse = require("./miniHttp_ServerResponse");

// Server object
function Server(requestListener) {
    net.Server.call(this);
    var that = this;
    if (requestListener) {
        this.addListener('request', requestListener);
    }
    
    this.addListener('connection', connectionListener);

    this.addListener('clientError', function(e, socket) {
        console.log("ERROR (%s) OCCURRED ON CLIENT FROM " + socket.remoteAddress, e.message);
        socket.destroy(e);
    });
    
    this.addListener('error', function (e) {
        console.log("SERVER ERROR: " + e.name + ": " + e.message);
    });
    
    this.timeout = 2 * 1000;
    this.setTimeout = function(msecs, callback) {
        that.timeout = msecs;
        if (callback) {
            that.on('timeout', callback);
        }
    };
}

Server.prototype = Object.create(net.Server.prototype);
Server.prototype.constructor = Server;

// called each time a new TCP stream is established
function connectionListener(socket) {
    var that = this;

    socket.pendingData = "";
    console.log("NEW CONNECTION ESTABLISHED FROM " + socket.remoteAddress + ':' + socket.remotePort);
    if (that.timeout) {
        socket.setTimeout(that.timeout);
    }
    socket.on('timeout', function() {
        var serverTimeout = that.emit('timeout', socket);
        if (!serverTimeout) { // no listeners for Server.timeout
            console.log("TIMEOUT OF CLIENT ON " + this.remoteAddress);
            socket.end();
        }
    });

    socket.on('error', function socketOnError(e) {
        that.emit('clientError', e, socket);
    });
    
    socket.on('close', function () {
        console.log("CONNECTION OF CLIENT ENDED");
    });
    
    var dataListener = function (data) {
        console.log("DATA RECEIVED FROM " + socket.remoteAddress + ':' + socket.remotePort);
        handleRequest(data.toString(), socket);
    };
    
    socket.on('data', dataListener);

    var handleRequest = function (dataStr, socket) { 
        console.log("HANDLING DATA FROM " + socket.remoteAddress + ':' + socket.remotePort);
        try {
            var req = new ClientRequest(socket);
            var res = new ServerResponse(socket);

            var dataLeft = parser.parseHttpRequest(req, socket.pendingData + dataStr);
            
            var shouldKeepAlive = isPersistentConnection(req);
            res.shouldKeepAlive = shouldKeepAlive;
            
            socket.pendingData = "";
            that.emit('request', req, res);
            
            if (!shouldKeepAlive) {
                socket.removeListener("data", dataListener);
                return;
            }
            
            // Try to handle the data left in the data string (Excluding the http request that have been parsed and handled)
            if (dataLeft) {
                handleRequest(dataLeft, socket);
            }
            
        } catch (e) {
            if (e instanceof parser.NotHttpRequest) {
                res.writeError(500);
            } else if (e instanceof parser.PartialHttpRequest) {
                socket.pendingData += dataStr;
            } else if (e instanceof parser.UsupportedHttpMethod) {
                res.writeError(405);
            }
        }        
    };
}

exports.createServer = function (requestListener) {
    return new Server(requestListener);
};

// Exports
exports.Server = Server;
exports.ServerResponse = ServerResponse;

// Returns whether the connection is persistence or not
var isPersistentConnection = function (clientRequest) {
    // Check if the version of the HTTP request is 1.0 and there is not
    // 'Connection: keep-allove' header in it.
    if (clientRequest.httpVersion === 'http/1.0' &&
            clientRequest.headers['connection'] !== 'keep-alive') {
        return false;
    }
    
    // Check if the request contains a 'Connection: close' header
    if (clientRequest.headers['connection'] === "close") {
        return false;
    }
    
    return true;
};