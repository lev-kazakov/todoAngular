var miniexpress = require("./server/miniExpress");
var uuid = require('node-uuid');
var app = miniexpress();

var users = {};

var key2user = {};

app.use(miniexpress.bodyParser());
app.use(miniexpress.cookieParser());

app.delete("/item", function (req, res, next) {
    var todos = users[key2user[req.cookies.key]].todos
    var idToDelete = req.body.id;
    if (idToDelete === '-1') {
        for (var id in todos) {
            if (todos[id].status === 1) {
                delete todos[id];
            }
        }
    } else {
        delete todos[idToDelete];
    }
    res.json(200, {status: 0});
});

// For adding tasks
app.post('/item', function (req, res, next) {
    var todos = users[key2user[req.cookies.key]].todos
    console.log("NEW TASK!");
    // Workaround: req.bodt.status is received as string, not as a number as expected
    req.body.status = +req.body.status;
    
    if (req.body.id in todos) {
        res.json(500, {error: 'todoId is already taken'});
        return;
    }
    todos[req.body.id] = req.body;
    res.json(200, {status: 0});
});

// For updating tasks
app.put("/item", function(req, res, next) {
    var todos = users[key2user[req.cookies.key]].todos
    var taskId = req.body.id;
    
    // Verify that the given task id is legal
    if (!(taskId in todos)) {
        res.json(200, {status: 1, error: 'task id doesnt exist'});
        return;
    }
    
    req.body.status = +req.body.status;
    todos[taskId] = req.body;
    res.json(200, {status: 0});
});

// For getting all tasks in the todo list
app.get("/item", function(req, res, next) {
    if (!req.cookies || !req.cookies.key || !(req.cookies.key in key2user)) {
        console.log('ATTACK!!!');
        res.json(400, {status: 1, error: 'please login or register'})
    } else {
        res.json(users[key2user[req.cookies.key]].todos);
    }
});

app.get('/login', function (req, res, next) {
    console.log('User login');
    
    if (req.query.username in users) {
        if (req.query.password === users[req.query.username].password) {
            // set cookie
            var key = uuid.v4()
            users[req.query.username].sessionId = key
            key2user[key] = req.query.username
            res.cookie('key', key, { maxAge: 900000, httpOnly: true })
            res.json(200, {status:0});
        } else {
            res.json(200, {status: 1, error: 'Wrong password'});
        }
    } else {
        res.json(200, {status: 1, error: 'Unknown username'});
    }
});

app.post('/register', function (req, res, next) {
    console.log('Registration!!!');
    if (req.body.username in users) {
        res.json(500, {error: 'username is already taken'});
    } else {
        users[req.body.username] = req.body;
        users[req.body.username].todos = {}
        
        // set-cookie
        var key = uuid.v4()
        users[req.body.username].sessionId = key
        key2user[key] = req.body.username
        res.cookie('key', key, { maxAge: 900000, httpOnly: true })
        
        res.json(200, {status:0});
    }
});

app.use(miniexpress.static(__dirname + "/static"));

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});