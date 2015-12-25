var fs = require("fs");
var events = require("events");

function Cell(x, y) {
  var self = this;
  self.state = 0;
  self.x = x;
  self.y = y;
  self.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
}

function Grid() {
  var self = this;
  self.iteration = 0;
  self.running = false;
  self.timeoutFn = null;
  self.pattern = [];
  self.map = [];
  self.sound = 0; // default value
  self.speed = 1000; // default value
  self.expected = undefined;

  self.timeoutFn = (function() {
    var timer;

    return function(state) {
      if(state === false) {
        clearTimeout(timer);
      } else {
        var dt = Date.now() - self.expected;
        self.expected += self.speed;

        timer = setTimeout(function() {
          self.scheduler();
        }, Math.max(0, self.speed - dt));
      }
    };
  })();

  events.EventEmitter.call(this);
}

Grid.prototype.__proto__ = events.EventEmitter.prototype;

Grid.prototype.init = function(size, speed) {
  var self = this;

  self.size = size;
  self.speed = speed;

  for(var x = 0; x < this.size; x++) {
    this.pattern[x] = [];
    for(var y = 0; y < this.size; y++) {
      this.pattern[x][y] = new Cell(x, y);
    }
  }

  for(var x = 0; x < this.size; x++) {
    this.map[x] = [];
    for(var y = 0; y < this.size; y++) {
      this.map[x][y] = new Cell(x, y);
    }
  }
};

Grid.prototype.seed = function() {
  var self = this;

  for(var x = 0; x < self.size; x++) {
    for(var y = 0; y < self.size; y++) {
      self.map[x][y].state = self.pattern[x][y].state;
    }
  }

  self.iteration = 0;
};

Grid.prototype.start = function() {
  var self = this;

  if(!self.running) {
    self.running = true;
    self.emit("start");
    self.expected = Date.now() + self.speed;
    self.timeoutFn(true);
  } else {
    console.log("already started !");
  }
};

Grid.prototype.scheduler = function() {
  var self = this;

  self.iter();
  self.timeoutFn(true);
};

Grid.prototype.stop = function() {
  var self = this;
  self.timeoutFn(false);
  self.running = false;
  self.emit("stop");
};

Grid.prototype.clear = function() {
  for(var x = 0; x < this.size; x++) {
    for(var y = 0; y < this.size; y++) {
      this.pattern[x][y].state = 0;
    }
  }

  for(var x = 0; x < this.size; x++) {
    for(var y = 0; y < this.size; y++) {
      this.map[x][y].state = 0;
    }
  }
};

Grid.prototype.setSpeed = function(speed) {
  var self = this;
  self.speed = speed;
  return self;
};

Grid.prototype.changeSound = function(sound) {
  var self = this;
  self.sound = sound;
  return self;
};

Grid.prototype.iter = function() {
  var updates = [];

  if(this.iteration === 0) {
    /* the first generation is just a copy of the pattern */
    for(var x = 0; x < this.size; x++) {
      for(var y = 0; y < this.size; y++) {
        if(this.map[x][y].state > 0) {
          this.map[x][y].state = 1;
          updates.push({
            cell: this.map[x][y],
            state: 1
          });
        }
      }
    }
  } else {
    for(var x = 0; x < this.size; x++) {
      for(var y = 0; y < this.size; y++) {
        var alive = 0;

        var x2 = x;
        if(x === 0) {
          var x1 = this.size - 1;
        } else {
          var x1 = x - 1;
        }

        if(x === (this.size - 1)) {
          var x3 = 0;
        } else {
          var x3 = x + 1;
        }

        var y2 = y;
        if(y === 0) {
          var y1 = this.size - 1;
        } else {
          var y1 = y - 1;
        }

        if(y === (this.size - 1)) {
          var y3 = 0;
        } else {
          var y3 = y + 1;
        }

        alive += Math.min(this.map[x1][y1].state, 1);
        alive += Math.min(this.map[x1][y2].state, 1);
        alive += Math.min(this.map[x1][y3].state, 1);
        alive += Math.min(this.map[x2][y1].state, 1);
        alive += Math.min(this.map[x2][y3].state, 1);
        alive += Math.min(this.map[x3][y1].state, 1);
        alive += Math.min(this.map[x3][y2].state, 1);
        alive += Math.min(this.map[x3][y3].state, 1);

        if(alive === 3) {
          if(this.map[x][y].state === 0) {
            updates.push({
              cell: this.map[x][y],
              state: 1
            });
          } else {
            updates.push({
              cell: this.map[x][y],
              state: 2
            });
          }
        } else if(alive < 2 || alive > 3) {
          if(this.map[x][y].state >= 1) {
            updates.push({
              cell: this.map[x][y],
              state: 0
            });
          }
        } else {
          if(this.map[x][y].state === 1) {
            updates.push({
              cell: this.map[x][y],
              state: 2
            });
          }
        }
      }
    }

    for(var i = 0; i < updates.length; i++) {
      updates[i].cell.state = updates[i].state;
    }
  }

  this.iteration++;

  if(updates.length > 0) {
    this.emit("update", updates);
  }
};

Grid.prototype.print = function() {
  console.log("Iteration [" + this.iteration + "]");

  for(var x = 0; x < this.size; x++) {
    for(var y = 0; y < this.size; y++) {
      if(this.map[x][y].state === 0) {
        process.stdout.write(this.map[x][y].state.toString());
      } else {
        process.stdout.write(this.map[x][y].state.toString());
      }
      process.stdout.write(" ");
    }
    process.stdout.write("\n");
  }
};

Grid.prototype.loadData = function(data, callback) {
  var self = this;

  self.size = data["size"];
  self.speed = data["speed"];
  self.sound = data["sound"];
  self.pattern = data["pattern"];
  self.iteration = 0;
  self.map = [];

  if(callback !== null) {
    callback(null);
  }
};

Grid.prototype.loadFile = function(filename, callback) {
  var self = this;

  fs.readFile(filename, function(err, data) {
    if(err) {
      return console.log("could load file " + filename + "(" + err + ")");
    }

    self.loadData(JSON.parse(data), callback);
  });
};

Grid.prototype.saveFile = function(filename, callback) {
  var self = this;

  var data = {
    size: self.size,
    speed: self.speed,
    sound: self.sound,
    pattern: self.pattern
  };

  fs.writeFile(filename, JSON.stringify(data), function(err) {
    if(err) {
      return console.log("cannot write file " + filename + "(" + err +")");
    }

    if(callback !== null) {
       callback(null);
    }
  });
};

module.exports = Grid;
