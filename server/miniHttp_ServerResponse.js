var EventEmitter = require('events').EventEmitter;
var fs = require("fs");
var path = require("path");
var httpConstants = require('./miniHttp_constants');

ServerResponse.prototype.writeResponse = function () {
    var statusInfo;
    var that = this;
    
    statusInfo = httpConstants.statusCodes[that.statusCode] || httpConstants.statusCodes.def;
    
    if (!that.socket) {
        throw new Error("Trying to write to a dead socket");
    }
    
    var response = ["HTTP/1.1 " + that.statusCode + " " + statusInfo];
    for (name in that.headers) {
        response.push(name + ": " + that.headers[name]);
    }
    response.push("");
    response.push(that.body || "");
    
    response = response.join("\r\n");
    
    // Write the response to the socket
    that.sent = true;
    that.socket.write(response, function () {
        if (!that.shouldKeepAlive) {
            that.socket.end();
        }
    });
};

ServerResponse.prototype.setHeader = function(name, value) {
      if (arguments.length < 2) {
        throw new Error('`name` and `value` are required for setHeader().');
      }

      this.headers[name.toLowerCase()] = value;
};

ServerResponse.prototype.getHeader = function(name) {
  if (name === undefined) {
    throw new Error('`name` is required for getHeader().');
  }

  return this.headers[name.toLowerCase()];
};

ServerResponse.prototype.write = function (data, callback) {
    if (this.socket) {
        this.socket.write(data, callback);
    } else {
        throw new Error("Trying to write to a dead socket");
    }
};

ServerResponse.prototype.writeFile = function () {
    var that = this;
    if (!that.resourcePath) {
        return;
    }
    
    that.sent = true;
    fs.stat(that.resourcePath, function (err, stats) {
        /* If an error occurred (Most probably the file doesn't exist) or if the
           requested resource is a directory, report to the user that the file wan't found */
        if (err || !stats.isFile()) {
            that.writeError(404);
            return;
        }
        
        // Pipe the resource into the socket and don't close the connection when it ends
        var resourceAsStream = fs.createReadStream(that.resourcePath);
        resourceAsStream.on("open", function () {
            var response = ["HTTP/1.1 200 OK", "Content-Type: " + getContentTypeOfFile(that.resourcePath), "Content-Length: " + stats.size, "", ""].join("\r\n");

            that.write(response , function () {
                resourceAsStream.pipe(that.socket, { end: false });
                if (!that.shouldKeepAlive) {
                    resourceAsStream.on('end', function() {
                        that.socket.end();
                    });
                }
            });
        });
        
        // In case of a faliure creating a read stream from the file, send to the user error #404
        resourceAsStream.on("error", function (err) {
            that.writeError(404);
        });
    });
};

ServerResponse.prototype.writeError = function (errorCode) {
    var that = this;
    var statusInfo = httpConstants.statusCodes[errorCode] || httpConstants.statusCodes.def;
    var errorBody = httpConstants.errorMessagesMap[errorCode] || httpConstants.errorMessagesMap.def;
    
    this.write(
            "HTTP/1.1 " + errorCode + " " + statusInfo + "\r\n"+
            "Content-Type:text/plain\r\n"+
            "Content-Length: " + errorBody.length + "\r\n\r\n"+
            errorBody,
            function () {
                if (!that.shouldKeepAlive) {
                    that.socket.end();
                }
            });
};

ServerResponse.prototype.statusCode = 200;
ServerResponse.prototype.statusMessage = undefined;

function ServerResponse(socket) {
    this.socket = socket;
    this.resourcePath = undefined;
    this.shouldKeepAlive = false;
    this.headers = {};
    this.sent = false;
}
ServerResponse.prototype.__proto__ = EventEmitter.prototype;

module.exports = ServerResponse;

// Get the content type of the given file name (Determined by the file name's extenstion).
var getContentTypeOfFile = function (fileName) {
    var fileExtension = path.extname(fileName).substr(1).toLowerCase();
    if (fileExtension in httpConstants.fileExtensionsToContentType) {
        return httpConstants.fileExtensionsToContentType[fileExtension];
    } else {
        return httpConstants.fileExtensionsToContentType.def;
    }
};

