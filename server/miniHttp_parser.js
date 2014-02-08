var knownHttpMethods = ["get", "post", "put", "delete"];

var NotHttpRequest = function (message) {
    this.name = "NotHttpRequest";
    this.message = message || "Server received an invalid HTTP request!";
};

var PartialHttpRequest = function (message) {
    this.name = "PartialHttpRequest";
    this.message = message || "Server got a partial HTTP request";
};

var UsupportedHttpMethod = function (message) {
    this.name = "UsupportedHttpMethod";
    this.message = message || "Server got an http request with an unsupported method";
};

// Returns an object specifying the parsed request data.
var parseHttpRequest = function (clientRequest, requestStr) {
    var lineSep = (requestStr.indexOf('\r\n') !== -1) ? '\r\n' : '\n';
    var requestLines = requestStr.split(lineSep);
    
    // Handle first line (request line)
    if (!requestLines[0]) {
        throw new PartialHttpRequest();
    }
    
    var initialLineElements = requestLines[0].trim().split(/[ \t]+/);
    if (initialLineElements.length !== 3) {
        // Check if there is any text in the next line. If so, this line is not a legal request line        
        if (initialLineElements.length > 3 || requestLines[1]) {
            throw new NotHttpRequest();
        } else {
            throw new PartialHttpRequest();
        }
    }
    
    clientRequest.method = initialLineElements[0].toLowerCase();
    clientRequest.url = initialLineElements[1];
    clientRequest.httpVersion = initialLineElements[2].toLowerCase();
    
    if (knownHttpMethods.indexOf(clientRequest.method) === -1) {
        throw new UsupportedHttpMethod();
    }
    
    // Verify that the request's http version is legal
    if ("http/1.".indexOf(clientRequest.httpVersion) === 0) {
        throw new PartialHttpRequest();
    } else if (!/^http\/1\.[01]$/.test(clientRequest.httpVersion)) {
        throw new NotHttpRequest();
    }
    
    // Parse headers
    var currentLineIndex = 1;    
    while(requestLines[currentLineIndex] && requestLines[currentLineIndex].trim()) {
        var colonIndex = requestLines[currentLineIndex].search(":");
        
        if (colonIndex === -1) {
            throw new PartialHttpRequest();
        }
        
        var headerName = requestLines[currentLineIndex].substr(0, colonIndex).trim().toLowerCase();
        var headerValue = requestLines[currentLineIndex].substr(colonIndex + 1).trim().toLowerCase();
        
        if (!headerName) {
            throw new NotHttpRequest();
        } else if (!headerValue) {
            throw new PartialHttpRequest();
        }
        
        clientRequest.headers[headerName] = headerValue;
        
        currentLineIndex++;
    }
    
    // Check existence of an empty line before the request body
    if (requestLines[currentLineIndex] === undefined) {
        throw new PartialHttpRequest();
    }
    currentLineIndex++;
        
    // Check if the body section exists
    if (requestLines[currentLineIndex] === undefined) {
        throw new PartialHttpRequest();
    }
    
    var temp = requestLines.slice(currentLineIndex).join(lineSep);
    var dataLeft;    
    if (clientRequest.headers["content-length"] === undefined) {
        clientRequest.body = "";
        dataLeft = temp;
    } else {
        // Verify that the data contains the all body content
        if (temp.length < clientRequest.headers["content-length"]) {
            throw new PartialHttpRequest();
        } else {
            clientRequest.body = temp.substr(0, clientRequest.headers["content-length"]);
            dataLeft = temp.substr(clientRequest.headers["content-length"]);
        }
    }   
    
    return dataLeft;
};

exports.parseHttpRequest = parseHttpRequest;
exports.NotHttpRequest = NotHttpRequest;
exports.PartialHttpRequest = PartialHttpRequest;
exports.UsupportedHttpMethod = UsupportedHttpMethod;