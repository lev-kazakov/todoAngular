var http = require("http");
var net = require('net');
var miniExpress = require("./miniExpress");
var miniHttp = require("./miniHttp");

var testFunctions = {};

// Test error response when requesting a file that doesn't exist
var test0 = function () {
    console.log("Test 0 is running");
    
    var options = {
        hostname: 'localhost',
        port: 8888,
        method: 'GET',
        headers: {
            connection : "keep-alive"
        },
        path: '/notExistsFile'
    };
    
    var req = http.request(options, function (res) {
        res.on('data', function (resData) {
            console.log('Response body: ' + resData);
        });
    });
    req.end();
};
test0.description = "Test error response when requesting a file that doesn't exist";

// Test error response when the request is not a get, delete, post or put request
var test1 = function () {
    console.log("Test 1 is running");
    
    var options = {
        hostname: 'localhost',
        port: 8888,
        method: 'QQQ',
        headers: {
            connection : "keep-alive"
        },
        path: '/profile.html'
    };
    
    var req = http.request(options, function (res) {
        res.on('data', function (resData) {
            console.log('Response body: ' + resData);
        });
    });
    req.end();
};
test1.description = "Test error response when the request is not a get, delete, post or put request";

// Test server load handling
// Expcted behvior : The server shouldn't crash
var test2 = function () {
    console.log("Test 2 is running");   

    var httpRequest = "GET /calculator.js http/1.1\nConnection: keep-alive\n\n";
    var numOfClients = 500;
    var clients = [];

    for (var i = 0; i < numOfClients; i++) {
        
        (function (x) {
            clients[x] = net.connect({port: 8888, host: "localhost"}, function () { //'connect' listenerreturn
                console.log('client ' + x + ' connected');
                clients[x].write(httpRequest);        
            });
            
            clients[x].on('data', function (data) {
                console.log("Data received");
            });
            
            clients[x].on('end', function () {
                console.log("client " + x + " disconnected");
            });
        })(i);    
    }
};
test2.description = "Test server load handling";

// Test persistent connection
// Expceted behavior : Data received twice and then the connection ends timeout
var test3 = function () {
    console.log("Test 3 is running");
    
    var httpRequest1 = "GET / http/1.1\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {
        var toSend = true;
        
        client.write(httpRequest1);
        client.on("data", function (data) {
            console.log("Data received");
            if (toSend) {
                client.write(httpRequest1);
                toSend = false;
            }
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test3.description = "Test persistent connection";

// Test persistent connection and sending two messages in one buffer
// Expceted behavior : Only first request should be handeled.
var test4 = function () {
    console.log("Test 4 is running");   
    
    var httpRequest = "GET /profile.html http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {
        
        client.write(httpRequest);
        client.write(httpRequest);

        client.on("data", function (data) {
            console.log("Data received");
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test4.description = "Test persistent connection and sending two messages in one buffer";

// Test handling an http request the got splitted in it's request line to two buffers into to data buffers in the TCP connection.
// Expceted behavior : Data should be joined and the request should be handled.
var test5 = function () {
    console.log("Test 5 is running");   
    
    var httpRequestPart1 = "GET /";
    var httpRequestPart2 = " http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {
        
        client.write(httpRequestPart1);
        setTimeout(function () {
            client.write(httpRequestPart2);
        }, 1000);
        
        client.on("data", function (data) {
            console.log("Data received");
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test5.description = "Test handling an http request the got splitted in it's request line to two buffers into to data buffers in the TCP connection."

// Test handling an http request that got splitted in it's body to two data buffers in the TCP connection.
// Expceted behavior : Data should be joined and the request should be handled.
var test6 = function () {
    console.log("Test 6 is running");   
    
    var httpRequestPart1 = "GET / http/1.0\nContent-length:5\n\n";
    var httpRequestPart2 = "HELLO";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequestPart1);
        setTimeout(function () {
            client.write(httpRequestPart2);
        }, 1000);
        
        client.on("data", function (data) {
            console.log("Data received");
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test6.description = "Test handling an http request that got splitted in it's body to two data buffers in the TCP connection.";

// Test handling an http request the got splitted to five different parts.
// Expceted behavior : Data should be joined and the request should be handled.
var test7 = function () {
    console.log("Test 7 is running");   
    
    var httpRequestPart1 = "GET ";
    var httpRequestPart2 = "/profile.html ";
    var httpRequestPart3 = "http/1.0\n";
    var httpRequestPart4 = "Content-length:5\n\n";
    var httpRequestPart5 = "HELLO_DataLeft";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequestPart1);
        setTimeout(function () {
            client.write(httpRequestPart2);
        }, 1000);
        
        setTimeout(function () {
            client.write(httpRequestPart3);
        }, 2000);
        
        setTimeout(function () {
            client.write(httpRequestPart4);
        }, 3000);
        
        setTimeout(function () {
            client.write(httpRequestPart5);
        }, 4000);
        
        client.on("data", function (data) {
            console.log("Data received: %s", data.toString());
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test7.description = "Test handling an http request the got splitted to five different parts.";

// Test handling two consecutive http request (one arrives 1 second after the other) when the first request doesn't ask a persistent connection.
// Expceted behavior : First request should be handled and the connection should be closed right after it (The second request shouldn't be handled).
var test8 = function () {
    console.log("Test 8 is running");   
    
    var httpRequest = "GET / http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
        setTimeout(function () {
            client.write(httpRequest);
        }, 1000);
                               
        client.on("data", function (data) {
            console.log("Data received");
        });
        
        client.on("end", function () {
            console.log("Connection ended");
        });
    });
};
test8.description = "Test handling two consecutive http request (one arrives 1 second after the other) when the first request doesn't ask a persistent connection.";

// Test request params
var test9 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.get("/:xParam", function(req, res, next) {
        if (req.params.xParam !== "xValue") {
            console.log("Test 9 failed!");
        } else {
            console.log("Test 9 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /xValue http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test9.description = "Test request params";

// Test request optional params (Part 1)
var test10 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.get("/:xParam?/:yParam?", function(req, res, next) {
        if (req.params.xParam !== "xValue") {
            console.log("Test 10 failed!");
        } else {
            console.log("Test 10 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /xValue http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test10.description = "Test request optional params (Part 1)";

// Test request optional params (Part 2)
var test11 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.get("/:xParam?/:yParam", function(req, res, next) {
        if (req.params.xParam !== undefined || req.params.yParam !== "yValue") {
            console.log("Test 11 failed!");
        } else {
            console.log("Test 11 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /yValue http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test11.description = "Test request optional params (Part 2)";

// Test request query
var test12 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use("/", function(req, res, next) {
        var query = req.query;
        if (query.order !== "desc" || query.shoe.color !== "blue" || query.shoe.type !== "converse") {
            console.log("Test 12 failed!");
        } else {
            console.log("Test 12 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /shoes?order=desc&shoe[color]=blue&shoe[type]=converse http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test12.description = "Test request query";

// Test request body when urlencoded is sent
var test13 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use(miniExpress.bodyParser());
    app.use("/", function(req, res, next) {
        var body = req.body;
        if (!body.user || body.user.name !== "tobi" || body.user.email !== "tobi@learnboost.com") {
            console.log("Test 13 failed!");
        } else {
            console.log("Test 13 succeeded!");
        }
    });
    
    // Send a request
    var requestBody = "user[name]=tobi&user[email]=tobi@learnboost.com";
    var httpRequest = "POST / http/1.0\n" +
            "content-length: " + requestBody.length + "\n" + 
            "content-type: application/x-www-form-urlencoded\n\n" + requestBody;
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test13.description = "Test request body when urlencoded is sent";

// Test request body when json is sent
var test14 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    var obj = {
        prop1: "v1",
        prop2: {
            subprop1: "sv1"
        }
    };
    app.use(miniExpress.bodyParser());
    app.use("/", function(req, res, next) {
        var body = req.body;
        if (!body || body.prop1 !== obj.prop1 || !body.prop2 || body.prop2.subprop1 !== obj.prop2.subprop1) {
            console.log("Test 14 failed!");
        } else {
            console.log("Test 14 succeeded!");
        }
    });
    
    // Send a request
    var requestBody = JSON.stringify(obj);
    var httpRequest = "POST / http/1.0\n" +
            "content-length: " + requestBody.length + "\n" + 
            "content-type: application/json\n\n" + requestBody;
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test14.description = "Test request body when json is sent";

// Test request body when json is sent
var test15 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use(function (req, res, next) {
        // Verify that the cookies object is empty by default, when the cookieParser middleware is used
        if (typeof req.cookies !== "object" || !req.cookies) {
            console.log("Test 15 failed");
            return;
        }
        next();
    });
    app.use(miniExpress.cookieParser());
    app.use("/", function(req, res, next) {
        if (!req.cookies || req.cookies.name !== "val") {
            console.log("Test 15 failed!");
        } else {
            console.log("Test 15 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET / http/1.0\n" +
            "Cookie: name=val" + "\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test15.description = "Verify that the cookies object is empty by default, when the cookieParser middleware is used and test cookie parser middleware";

var test16 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use("/", function(req, res, next) {
        if (req.path !== "/users") {
            console.log("Test 16 failed!");
        } else {
            console.log("Test 16 succeeded!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /users?sort=desc http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test16.description = "Test request path property";

var test17 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use("/", function(req, res, next) {
        next();
    });
    
    app.get(function(req, res, next) {
        console.log("Test 17 succeeded!");
        next();
    });
    
    app.delete(function(req, res, next) {
        console.log("Test 17 failed!");
        next();
    });
    
    app.post(function(req, res, next) {
        console.log("Test 17 failed!");
        next();
    });
    
    app.put(function(req, res, next) {
        console.log("Test 17 failed!");
        next();
    });
    
    var route = app.route;
    if (!route.get || !route.post || !route.delete || !route.put || route.get.length !== -1 ||
            route.post.length !== -1 || route.delete.length !== -1 || route.put.length !== -1) {
        console.log("Test 17 failed!");
    }
        
    // Send a request
    var httpRequest = "GET /profile.html http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        server.close();
    });
}
test17.description = "Test app.route object";

var test18 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    var enteredMW1 = false;
    var enteredMW2 = false;
    var enteredMW3 = false;
    var enteredMW4 = false;
    app.use("/x", function(req, res, next) {
        enteredMW1 = true;
        next();
    });
    
    app.use("/x/y", function(req, res, next) {
        enteredMW2 = true;
        next();
    });
    
    app.use("/x/y/profile.html", function(req, res, next) {
        enteredMW3 = true;
        next();
    });
    
    app.use("/x/y/profile.html/z", function(req, res, next) {
        enteredMW4 = true;
        next();
    });
    
    // Send a request
    var httpRequest = "GET /x/y/profile.html http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("close", function() {
        if (!enteredMW1 || !enteredMW2 || !enteredMW3 || enteredMW4) {
            console.log("Test 18 failed!");
        } else {
            console.log("Test 18 succeeded!");
        }
        server.close();
    });
}
test18.description = "Test prefix support for the route given to app.use";

var test19 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use('/200', function(req, res, next) {
        res.send('default status code\n\n');
        if (res.statusCode !== 200) {
            console.log("Test 19 FAILED!");
        }
    });
    app.use('/500', function(req, res, next) {
        res.status(500).send('status changed to 500\n\n');
        if (res.statusCode !== 500) {
            console.log("Test 19 FAILED!");
        }
    });
    app.use('/999', function(req, res, next) {
        res.status(999).send('status changed to 999 (status code with no string representation)\n\n');
        if (res.statusCode !== 999) {
            console.log("Test 19 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /200 http/1.1\n\n" + "GET /500 http/1.1\n\n" + "GET /999 http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test19.description = "Test res.status()";

var test20 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use('/def', function(req, res, next) {
        res.send('default response\n\n');
        if (res.get('content-type') !== 'text/html') {
            console.log("Test 20 FAILED!");
        }
    });
    app.use('/header12', function(req, res, next) {
        res.set("header1", "value1");
        res.set("header2", "value2");
        if (res.get('header1') !== 'value1' || res.get('header2') !== 'value2') {
            console.log("Test 20 FAILED!");
        }
        res.send('header1=value1, header2=value2 added\n\n');
    });
    app.use('/object', function(req, res, next) {
        res.header({
          'Content-Type': 'text/plain',
          'Content-Length': '123',
          'ETag': '12345'
        }).send('Content-Type altered, Content-Length should be updated, ETag added\n\n');
        if (res.get('ETag') !== '12345') {
            console.log("Test 20 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = "GET /def http/1.1\n\n" + "GET /header12 http/1.1\n\n" + "GET /object http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test20.description = "Test res.get(field) as well as res.set(field, [value]) aliased as res.header(field, [value])";

var test21 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    app.use('/cookie', function(req, res, next) {
        res.cookie('rememberme', 'tobi').send('rememberme: tobi\n\n');
    });
    app.use('/options', function(req, res, next) {
        res.cookie('rememberme', 'tobi', { domain: '.example.com', path: '/admin', secure: true }).send('rememberme: tobi + options altered\n\n');
    });
    app.use('/expires', function(req, res, next) {
        res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true }).send('rememberme: tobi + expires altered\n\n');
    });
    app.use('/maxage', function(req, res, next) {
        res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true }).send('rememberme "expires" attribute should have stayed the same\n\n');
    });
    app.use('/json', function(req, res, next) {   
        res.cookie('rememberme', { items: [1,2,3] }).send('rememberme + json\n\n');
    });
    app.use('/everything', function(req, res, next) {   
        res.cookie('rememberme', { items: [1,2,3] }, { maxAge: 900000, secure: false }).send('rememberme + json + options\n\n');
    });
    
    // Send a request
    var httpRequest =   "GET /cookie http/1.1\n\n" + "GET /options http/1.1\n\n" + "GET /expires http/1.1\n\n" + 
                        "GET /maxage http/1.1\n\n" + "GET /json http/1.1\n\n" + "GET /everything http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test21.description = "Test res.cookie(name, value, [options])";

var test22 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    
    app.use('/buffer', function(req, res, next) {
        body = 'buffer\n\n';
        res.send(new Buffer(body));
        if (res.get('content-length') !== body.length) {
            console.log("Test 22 FAILED!");
        }
        if (res.statusCode !== 200) {
            console.log("Test 22 FAILED!");
        }
    });
    app.use('/json', function(req, res, next) {
        body = JSON.stringify({ json: 'json' });
        res.send({ json: 'json' });
        if (res.get('content-length') !== body.length) {
            console.log("Test 22 FAILED!");
        }
        if (res.get('content-type') !== 'application/json') {
            console.log("Test 22 FAILED!");
        }
        if (res.statusCode !== 200) {
            console.log("Test 22 FAILED!");
        }
    });
    app.use('/string', function(req, res, next) {
        body = 'string\n\n';
        res.send(body);
        if (res.get('content-length') !== body.length) {
            console.log("Test 22 FAILED!");
        }
        if (res.get('content-type') !== 'text/html') {
            console.log("Test 22 FAILED!");
        }
        if (res.statusCode !== 200) {
            console.log("Test 22 FAILED!");
        }
    });
    app.use('/code_string', function(req, res, next) {
        body = 'status code 404 + body\n\n';
        res.send(404, body);
        if (res.get('content-length') !== body.length) {
            console.log("Test 22 FAILED!");
        }
        if (res.get('content-type') !== 'text/html') {
            console.log("Test 22 FAILED!");
        }
        if (res.statusCode !== 404) {
            console.log("Test 22 FAILED!");
        }
    });
    app.use('/code_json', function(req, res, next) {
        body = JSON.stringify({ json: 'status code 500 + json' });
        res.send(500, { json: 'status code 500 + json' });
        if (res.get('content-length') !== body.length) {
            console.log("Test 22 FAILED!");
        }
        if (res.get('content-type') !== 'application/json') {
            console.log("Test 22 FAILED!");
        }
    });
    app.use('/code', function(req, res, next) {
        res.send(501);
        if (res.statusCode !== 501) {
            console.log("Test 22 FAILED!");
        }
        if (res.body) {
            console.log("Test 22 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest =   "GET /buffer http/1.1\n\n" + "GET /json http/1.1\n\n" + "GET /string http/1.1\n\n" + 
                        "GET /code_string http/1.1\n\n" + "GET /code_json http/1.1\n\n" + "GET /code http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test22.description = "Test res.send([body|status], [body])";

var test23 = function () {
    var app = miniExpress();
    var server = app.listen(8888);
    
    app.use('/null', function(req, res, next) {
        body = null;
        res.json(body)
        if (res.get('content-length') !== JSON.stringify(body).length) {
            console.log("Test 23 FAILED!");
        }
        if (res.get('content-type') !== 'application/json') {
            console.log("Test 23 FAILED!");
        }
    });
    app.use('/json', function(req, res, next) {
        body = JSON.stringify({ json: 'json' });
        res.json({ json: 'json' });
        if (res.get('content-length') !== body.length) {
            console.log("Test 23 FAILED!");
        }
        if (res.get('content-type') !== 'application/json') {
            console.log("Test 23 FAILED!");
        }
    });
    app.use('/code_json', function(req, res, next) {
        body = JSON.stringify({ json: 'status code 500 + json' });
        res.json(500, { json: 'status code 500 + json' });
        if (res.get('content-length') !== body.length) {
            console.log("Test 23 FAILED!");
        }
        if (res.get('content-type') !== 'application/json') {
            console.log("Test 23 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest =   "GET /null http/1.1\n\n" + "GET /json http/1.1\n\n" + "GET /code_json http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test23.description = "Test res.json([body|status], [body])";

/* Middlewares */

var test24 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use("/a/b", miniExpress.static(__dirname + "\\www"));
    
    // Send a request
    var httpRequest =   "GET /a/b/profile.html http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test24.description = "Test miniExpress.static(rootFolder) existant file";

var test25 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use("/c/d", miniExpress.static(__dirname + "\\www"));
    
    // Send a request
    var httpRequest = "GET /c/d/../profile.html http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test25.description = "Test miniExpress.static(rootFolder) file not under root folder";

var test26 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use(miniExpress.static(__dirname + "\\www"));
    
    // Send a request
    var httpRequest = "GET /notexist.js http/1.0\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test26.description = "Test miniExpress.static(rootFolder) not existing file";

var test27 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use(miniExpress.cookieParser());
    app.use(function(req, res, next) {
        res.send('name=' + req.cookies.name + ', ' + 'fam=' + req.cookies.fam);
        if (req.cookies.name !== 'tj' || req.cookies.fam !== 'dj') {
            console.log("Test 27 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = "GET / http/1.0\nCookie: name=tj;fam=dj\n\n";
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test27.description = "Test miniExpress.cookieParser()";

var test28 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use(miniExpress.json());
    app.use(function(req, res, next) {
        res.send(JSON.stringify(req.body));
        if (req.body.name !== 'value') {
            console.log("Test 28 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = 'GET / http/1.0\ncontent-length: 16\ncontent-type: application/json\n\n{"name":"value"}';
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test28.description = "Test miniExpress.json()";

var test29 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use(miniExpress.urlencoded());
    app.use(function(req, res, next) {
        res.send('param1 = ' + req.body.param1 + ', ' + 'param2 = ' + req.body.param2);
        if (req.body.param1 !== 'value1' || req.body.param2 !== 'value2') {
            console.log("Test 29 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = 'GET / http/1.0\ncontent-length: 27\ncontent-type: application/x-www-form-urlencoded\n\nparam1=value1&param2=value2';
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test29.description = "Test miniExpress.urlencoded()";

var test30 = function () {
    var app = miniExpress();
    var server = miniHttp.createServer(app).listen(8888);
    
    app.use(miniExpress.bodyParser());
    app.use(function(req, res, next) {
        res.send('name = ' + req.body.user.name + ', ' + 'email = ' + req.body.user.email);
        if (req.body.user.name !== 'tobi' || req.body.user.email !== 'tobi@learnboost.com') {
            console.log("Test 30 FAILED!");
        }
    });
    
    // Send a request
    var httpRequest = 'GET / http/1.0\ncontent-length: 47\ncontent-type: application/x-www-form-urlencoded' + '\n\n' +
                      'user[name]=tobi&user[email]=tobi@learnboost.com';
    var client = net.connect({port: 8888, host: "localhost"}, function () {        
        client.write(httpRequest);
    });
    
    client.on("data", function(data) {
        console.log(data.toString() + '\n');
    });
    
    client.on("close", function() {
        server.close();
    });
}
test30.description = "Test miniExpress.bodyParser()";

var numOfTests = 31;

for (i = 0; i < numOfTests; i++) {
    testFunctions[i] = eval("test" + i);
}

if (!process.argv[2] || process.argv[2] === "/h") {
    console.log("Usage : tester <#test>");
    for (i = 0; i < numOfTests; i++) {
        console.log(i + "\t" + eval("test" + i).description);
    }
} else {
    var testNum = +process.argv[2];
    if (testNum < 0 || testNum >= numOfTests) {
        console.log("Illegal test number");
    } else {
        eval("test" + testNum)();
    }
}