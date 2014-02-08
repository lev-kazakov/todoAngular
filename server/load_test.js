// Test server load handling
// Expcted behvior : The server shouldn't crash
var net = require('net');

var httpRequest = "GET /profile.html http/1.1\nConnection: keep-alive\n\n";
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