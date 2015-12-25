var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var SoundFile = require("./soundfile.js");
var Grid = require("./grid");
var routes = require('./routes/index');

var app = express();
var soundfile = new SoundFile();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set("port", process.env.PORT || "3000");

var server = app.listen(app.get("port"), function() {
  console.log("Listening on " + server.address().port);
});

var io = require("socket.io").listen(server);
var namespace = "main";

soundList = soundfile.loadSync(path.join("public", "sounds"));
app.set("soundList", soundList);

var g1 = new Grid();
g1.init(16, 1000);

var g2 = new Grid();
g2.init(16, 1000);

g1.on("update", function(updates) {
  io.to(namespace).emit("update", "gid-1", updates);
});

g2.on("update", function(updates) {
  io.to(namespace).emit("update", "gid-2", updates);
});

g2.start();

var mixer = {
  "gid-1": g1,
  "gid-2": g2,
  "soundList": soundList
};

io.sockets.on("connection", function(socket) {
  socket.on("hello", function(callback) {
    console.log("Client connected !");

    socket.join(namespace);

    socket.on("params", function(gid, type, value) {
      if(gid === "gid-1") {
        if(type === "speed") {
          g1.setSpeed(value);
        } else if(type === "sound") {
          g1.changeSound(value);
        }
      } else {
        if(type === "speed") {
          g2.setSpeed(value);
        } else if(type === "sound") {
          g2.changeSound(value);
        }
      }

      console.log("[" + gid + "] -> " + type + " = " + value);
      socket.broadcast.to(namespace).emit("params", gid, type, value);
    });

    socket.on("clear", function(gid) {
      if(gid === "gid-1") {
        g1.clear();
      } else {
        g2.clear();
      }

      console.log("[" + gid + "] -> clear");
      socket.broadcast.to(namespace).emit("clear", gid);
    });

    socket.on("seed", function(gid) {
      if(gid === "gid-1") {
         g1.seed()
      } else {
        g2.seed();
      }

      console.log("[" + gid + "] -> seed");
      socket.broadcast.to(namespace).emit("seed", gid);
    });

    socket.on("iter", function(gid) {
      if(gid === "gid-1") {
        g1.iter();
      } else {
        g2.iter();
      }
    });

    socket.on("change", function(gid, cell) {
      if(gid === "gid-1") {
        g1.pattern[cell.x][cell.y].state = cell.state;
      } else {
        g2.pattern[cell.x][cell.y].state = cell.state;
      }

      socket.broadcast.to(namespace).emit("change", gid, cell);
    });

    socket.on("load", function(gid, grid) {
      socket.broadcast.to(namespace).emit("load", gid, grid);
    });

    socket.on("volume", function(value) {
      socket.broadcast.to(namespace).emit("volume", value);
    });

    callback(null, mixer);
  });

  socket.on("disconnect", function() {
    console.log("Client disconnected !");
  });

  socket.on("error", function(err, msg) {
    console.log(err + ": " + msg);
  });
});

module.exports = app;
