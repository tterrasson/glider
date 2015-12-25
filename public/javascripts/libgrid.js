"use strict";

var libgrid = libgrid || {};

libgrid.Cell = function(x, y) {
  var self = this;
  self.state = 0;
  self.x = x;
  self.y = y;
  self.id = null;
  self.isPlaying = false;
  self.fillCmd = null;
  self.color = null;
};

libgrid.Cell.prototype.draw = function(graphic, color, size) {
  var self = this;
  if(self.fillCmd === null) {
    self.fillCmd = graphic.beginFill(color).command;
    graphic.drawRect(this.x, this.y, size, size);
    graphic.endFill();
  } else {
    self.fillCmd.style = color;
  }
};

libgrid.Cell.prototype.resetColor = function() {
  var self = this;
  if(self.fillCmd !== null) {
    self.fillCmd.style = self.color;
  }
};

/* -------------------------------------------------------- */

libgrid.LineGrid = function(graphics, x, y, w, h) {
  var self = this;
  self.x = x;
  self.y = y;
  self.w = w;
  self.h = h;
  self.fillCmd = null;
  self.graphics = graphics;
  self.refCount = 0;
};

libgrid.LineGrid.prototype.draw = function(color) {
  var self = this;
  if(self.fillCmd === null) {
    self.fillCmd = self.graphics.beginStroke(color).command;
    self.graphics.moveTo(self.x, self.y);
    self.graphics.lineTo(self.w, self.h);
    self.graphics.endStroke();
  } else {
    self.fillCmd.style = color;
  }
};

/* -------------------------------------------------------- */

libgrid.Grid = function(gid, container, canvasId, row, lineColor) {
  var self = this;
  self.row = row;
  self.gid = gid;
  self.stage = new createjs.Stage(canvasId);
  self.shape = new createjs.Shape();
  self.stage.addChild(this.shape);
  self.g = this.shape.graphics;
  self.$container = $(container);
  self.initialized = false;
  self.lineList = [[], []];
  self.lineColor = lineColor;

  this.map = [];
  for(var x = 0; x < row; x++) {
    this.map[x] = [];
    for(var y = 0; y < row; y++) {
      this.map[x][y] = new libgrid.Cell(x, y);
    }
  }

  /* private functions */
  function onResize(ev) {
    self.stage.canvas.width = self.$container.width();
    self.stage.canvas.height = self.$container.width();
    self.space = self.$container.width() / self.row;

    self.g.clear();
    if(self.lineColor !== null) {
      self.draw();
    }

    if(self.initialized) {
      for(var x = 0; x < self.row; x++) {
        for(var y = 0; y < self.row; y++) {
          self.map[x][y].fillCmd = null;
          self.setCell(self.map[x][y].state, x, y);
        }
      }
    }

    self.update();
  }

  onResize();
  $(window).resize($.throttle(500, onResize));
};

libgrid.Grid.prototype.init = function(model) {
  for(var x = 0; x < this.row; x++) {
    for(var y = 0; y < this.row; y++) {
      this.setCell(model[x][y].state, model[x][y].x, model[x][y].y);
      this.map[x][y].id = model[x][y].id;
    }
  }

  this.initialized = true;
};

libgrid.Grid.prototype.update = function() {
   var self = this;
   self.stage.update();
};

libgrid.Grid.prototype.draw = function() {
  var self = this;
  self.g.setStrokeStyle(1);
  var length = self.row * self.space;

  for(var i = 0, a = 0; i < length; i += self.space, a++) {
    this.lineList[0][a] = new libgrid.LineGrid(self.g, i, 0, i, length);
    this.lineList[0][a].draw(self.lineColor);
  }

  for(var i = 0, a = 0; i < length; i += self.space, a++) {
    this.lineList[1][a] = new libgrid.LineGrid(self.g, 0, i, length, i);
    this.lineList[1][a].draw(self.lineColor);
  }
};

libgrid.Grid.prototype.setCell = function(state, x, y) {
  var self = this;
  var pos_x = (this.space * x) + 1;
  var pos_y = (this.space * y) + 1;
  var size = this.space - 1;

  if(state === 1) {
    var color = "#00" + (parseInt("9521", 16) + (y * 8)).toString(16);
  } else if(state === 2) {
    var color = "#0" + (parseInt("B3982", 16) + (y * 8)).toString(16);
  } else {
    var color = "#002B36";
  }

  if(this.map[x][y].fillCmd === null) {
    this.map[x][y].fillCmd = this.g.beginFill(color).command;
    this.g.drawRect(pos_x, pos_y, size, size);
    this.g.endFill();
  } else {
    this.map[x][y].fillCmd.style = color;
  }

  this.map[x][y].state = state;
  this.map[x][y].color = color;
};

libgrid.Grid.prototype.getCell = function(stageX, stageY) {
  var self = this;
  var x = parseInt(stageX / self.space);
  var y = parseInt(stageY / self.space);
  return self.map[x][y];
};

libgrid.Grid.prototype.switchStateCell = function(x, y) {
  var self = this;
  var state = self.map[x][y].state === 1 ? 0 : 1;
  self.setCell(state, x, y);
};

libgrid.Grid.prototype.clear = function() {
  var self = this;

  for(var x = 0; x < this.row; x++) {
    for(var y = 0; y < this.row; y++) {
      if(self.map[x][y].state !== 0) {
        self.setCell(0, x, y);
      }
    }
  }
};

libgrid.Grid.prototype.resetColors = function() {
  var self = this;

  for(var x = 0; x < this.row; x++) {
    for(var y = 0; y < this.row; y++) {
      if(self.map[x][y].state !== 0) {
        self.map[x][y].resetColor();
      }
    }
  }

  self.stage.update();
};

/* -------------------------------------------------------- */

libgrid.ControlGrid = function(gid, wrapperId, canvasId, row) {
  var self = this;
  self.grid = new libgrid.Grid(gid, wrapperId, canvasId, row, "#006882");
  self.gid = gid;
  self.grid.stage.mouseMoveOutside = false;
  self.changes = {};
  self.isTouchDown = false;
  self.isTouchErase = false;
  self.initialized = false;
};

libgrid.ControlGrid.prototype.init = function(model) {
  var self = this;
  self.grid.init(model);

  createjs.Touch.enable(self.grid.stage);

  self.grid.stage.on("stagemousedown", function(ev) {
    self.onMouseDown(ev.stageX, ev.stageY);
  });

  self.grid.stage.on("stagemousemove", function(ev) {
    self.onMouseMove(ev.stageX, ev.stageY);
  });

  self.grid.stage.on("stagemouseup", function(ev) {
    self.onMouseUp(ev.stageX, ev.stageY);
  });

  self.grid.stage.update();
  self.initialized = true;
};

libgrid.ControlGrid.prototype.onMouseDown = function(stageX, stageY) {
  var self = this;
  var cell = self.grid.getCell(stageX, stageY);
  self.changes[cell.id] = cell;
  self.grid.switchStateCell(cell.x, cell.y);
  self.grid.update();
  self.isTouchErase = cell.state === 0 ? true : false;
  self.isTouchDown = true;
  $(document).trigger("grid-change", [self.gid, cell]);
};

libgrid.ControlGrid.prototype.onMouseMove = function(stageX, stageY) {
  var self = this;
  var cell = self.grid.getCell(stageX, stageY);

  if(cell.id in self.changes) {
    return;
  }

  if(self.isTouchDown) {
    if(self.isTouchErase && cell.state > 0) {
      self.changes[cell.id] = cell;
      self.grid.switchStateCell(cell.x, cell.y);
      $(document).trigger("grid-change", [self.gid, cell]);
    } else if(!self.isTouchErase && cell.state === 0) {
      self.changes[cell.id] = cell;
      self.grid.switchStateCell(cell.x, cell.y);
      $(document).trigger("grid-change", [self.gid, cell]);
    }

    self.grid.update();
  }
};

libgrid.ControlGrid.prototype.onMouseUp = function(stageX, stageY) {
  var self = this;
  self.changes = {};
  self.isTouchDown = false;
};

libgrid.ControlGrid.prototype.clear = function() {
  var self = this;
  self.grid.clear();
  self.grid.stage.update();
};

libgrid.ControlGrid.prototype.setCell = function(state, x, y) {
  var self = this;
  self.grid.setCell(state, x, y);
  self.grid.stage.update();
};

/* -------------------------------------------------------- */

libgrid.ScanAudioGrid = function(gid, wrapperId, canvasId, row) {
  var self = this;
  self.grid = new libgrid.Grid(gid, wrapperId, canvasId, row, null);
  self.gid = gid;
  self.speed = 200; // default value
  self.currentLine = 0;
  self.fileSound = new libaudio.FileSound(row);
  self.initialized = false;
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
}

libgrid.ScanAudioGrid.prototype.init = function(model, speed) {
  var self = this;

  self.speed = speed;
  self.grid.init(model);
  self.initialized = true;
};

libgrid.ScanAudioGrid.prototype.update = function(updates) {
  var self = this;

  for(var i = 0; i < updates.length; i++) {
    self.grid.setCell(updates[i].cell.state, updates[i].cell.x, updates[i].cell.y);
  }

  self.grid.update();
};

libgrid.ScanAudioGrid.prototype.setSpeed = function(value) {
  var self = this;
  self.speed = value;
};

libgrid.ScanAudioGrid.prototype.seed = function() {
  var self = this;
  self.clear();
  self.currentLine = 0;
  $(document).trigger("grid-iter", [self.gid]);
  self.expected = Date.now() + self.speed;
  self.timeoutFn(true);
};

libgrid.ScanAudioGrid.prototype.stopAllSound = function() {
  var self = this;

  for(var x = 0; x < self.grid.row; x++) {
    for(var y = 0; y < self.grid.row; y++) {
      if(self.grid.map[x][y].isPlaying) {
        self.fileSound.stop(self.grid.map[x][y]);
        self.grid.map[x][y].isPlaying = false;
      }
    }
  }
};

libgrid.ScanAudioGrid.prototype.clear = function() {
  var self = this;
  self.timeoutFn(false);
  self.stopAllSound();
  self.grid.clear();
  self.grid.update();
  self.started = false;
};

libgrid.ScanAudioGrid.prototype.scheduler = function() {
  var self = this;

  if(self.currentLine >= self.grid.row) {
    self.started = false;
    self.currentLine = 0;
    self.grid.resetColors();
    $(document).trigger("grid-iter", [self.gid]);
  } else {
    for(var y = 0; y < self.grid.row; y++) {
      if(self.grid.map[self.currentLine][y].state > 0) {
        self.fileSound.play(self.grid.map[self.currentLine][y]);
        //self.grid.map[self.currentLine][y].fillCmd.style = "#EEE8D5";
        self.grid.map[self.currentLine][y].fillCmd.style = "#002B36";

        self.grid.map[self.currentLine][y].isPlaying = true;
      }
    }

    self.currentLine++;
    self.grid.update();
  }

  self.timeoutFn(true)
};

libgrid.ScanAudioGrid.prototype.changeSound = function(value) {
  var self = this;
  self.stopAllSound();
  self.fileSound.changeSound(value)
};

/* -------------------------------------------------------- */

libgrid.InstantAudioGrid = function(gid, wrapperId, canvasId, row) {
  var self = this;
  self.grid = new libgrid.Grid(gid, wrapperId, canvasId, row, null);
  self.gid = gid;
  self.fileSound = new libaudio.FileSound(row);
  self.speed = 200; // default value
  self.initialized = false;
};

libgrid.InstantAudioGrid.prototype.init = function(model, speed, soundList) {
  var self = this;
  self.speed = speed;
  self.grid.init(model);
  self.fileSound.registerAll(soundList);
  self.grid.update();
  self.initialized = true;
};

libgrid.InstantAudioGrid.prototype.update = function(updates) {
  var self = this;

  for(var i = 0; i < updates.length; i++) {
    self.grid.setCell(updates[i].cell.state, updates[i].cell.x, updates[i].cell.y);

    if(updates[i].cell.state >= 1) {
      if(self.grid.map[updates[i].cell.x][updates[i].cell.y].isPlaying === false) {
        self.fileSound.play(updates[i].cell);
        self.grid.map[updates[i].cell.x][updates[i].cell.y].isPlaying = true;
      }
    } else {
      if(self.grid.map[updates[i].cell.x][updates[i].cell.y].isPlaying === true) {
        self.fileSound.stop(updates[i].cell);
        self.grid.map[updates[i].cell.x][updates[i].cell.y].isPlaying = false;
      }
    }
  }

  self.grid.update();
};

libgrid.InstantAudioGrid.prototype.seed = function() {
  var self = this;
  self.clear();
};

libgrid.InstantAudioGrid.prototype.stopAllSound = function() {
  var self = this;

  for(var x = 0; x < self.grid.row; x++) {
    for(var y = 0; y < self.grid.row; y++) {
      if(self.grid.map[x][y].isPlaying) {
        self.fileSound.stop(self.grid.map[x][y]);
        self.grid.map[x][y].isPlaying = false;
      }
    }
  }
};

libgrid.InstantAudioGrid.prototype.clear = function() {
  var self = this;

  self.grid.clear();
  self.grid.update();
  self.stopAllSound();
};

libgrid.InstantAudioGrid.prototype.changeSound = function(value) {
  var self = this;

  self.stopAllSound();
  self.fileSound.changeSound(value);
};
