var fileExtensionsToContentType = require('./miniHttp_constants').fileExtensionsToContentType;

function Response(serverResponse) {
    var that = this;
    
    // Take attributes from the given serverResponse instance
    for (prop in serverResponse) {
        this[prop] = serverResponse[prop];
    }
    
    this.set =
    this.header = function(field, value){
        if (value !== undefined) {
            that.setHeader(field, value);
        } else {
            for (var key in field) {
                that.setHeader(key, field[key]);
            }
        }
        return that;
    };
    
    this.status = function (code) {
        that.statusCode = code;
        return that;
    };
    
    this.get = function (field) {
        return that.getHeader(field);
    };
    
    this.cookie = function (name, value, options) {
        options = (options) ? options : {};
        if (typeof value === 'object') {
            value = 'j:' + JSON.stringify(value);
        }
        if ('maxAge' in options) {
            options.expires = new Date(Date.now() + options.maxAge);
            options.maxAge /= 1000;
        }
        if (options.path === undefined) {
            options.path = '/';
        }
        
        var cookieHeaderValue = [name + '=' + value];
        if (options.maxAge) {
            cookieHeaderValue.push('max-age=' + options.maxAge);
        }
        if (options.domain) {
            cookieHeaderValue.push('domain=' + options.domain);
        }
        if (options.path) {
            cookieHeaderValue.push('path=' + options.path);
        }
        if (options.expires) {
            cookieHeaderValue.push('expires=' + options.expires.toUTCString());
        }
        if (options.httpOnly) {
            cookieHeaderValue.push('httponly');
        }
        if (options.secure) {
            cookieHeaderValue.push('secure');
        }
        cookieHeaderValue = cookieHeaderValue.join('; ');
    
        that.set('set-cookie', cookieHeaderValue);
        
        return that;
    };
    
    this.send = function () {
        var body = arguments[0];
        if (arguments.length >= 2) {
            that.statusCode = arguments[0];
            body = arguments[1];
        }
        
        switch (typeof body) {
        case 'number':
            that.statusCode = body;
            that.writeResponse();
            break;
        case 'string':
            if (!that.get('Content-Type')) {
                that.set('Content-Type', fileExtensionsToContentType.html); // defaulting to html
            }
            that.set('Content-Length', body.length);
            that.body = body;
            that.writeResponse();
            break;
        case 'object':
            if (Buffer.isBuffer(body)) {
                that.send(body.toString())
            } else {
                that.json(body);
            }
            break;
        }
        
        return that;
    };
    
    this.json = function () {
        var body = arguments[0];
        if (arguments.length == 2) {
            that.statusCode = body;
            body = arguments[1];
        }
        
        body = JSON.stringify(body);
        that.set('Content-Type', 'application/json');
        return that.send(body);
    };
}

module.exports = Response;