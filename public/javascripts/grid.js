"use strict";

(function() {

var socket = io.connect();

socket.on("connect", function() {
  socket.emit("hello", function(err, mixer) {
    var gridLeft = new libgrid.ScanAudioGrid("gid-1", "#wrapper-grid-left", "grid-left", 16);
    var gridRight = new libgrid.InstantAudioGrid("gid-2", "#wrapper-grid-right", "grid-right", 16);

    gridLeft.init(mixer["gid-1"].map, mixer["gid-1"].speed, mixer["soundList"]);
    gridRight.init(mixer["gid-2"].map, mixer["gid-2"].speed, mixer["soundList"]);

    socket.on("update", function(gid, updates) {
      if(gid === "gid-1") {
        gridLeft.update(updates);
      } else {
        gridRight.update(updates);
      }
    });

    socket.on("clear", function(gid) {
      if(gid === "gid-1") {
        gridLeft.clear();
      } else {
        gridRight.clear();
      }
    });

    socket.on("seed", function(gid) {
      if(gid === "gid-1") {
        gridLeft.seed();
      } else {
        gridRight.seed();
      }
    });

    socket.on("params", function(gid, type, value) {
      if(gid === "gid-1") {
        if(type === "speed") {
          gridLeft.setSpeed(value);
        } else if(type === "sound") {
          gridLeft.changeSound(value);
        }
      } else {
        if(type === "sound") {
          gridRight.changeSound(value);
        }
      }
    });

    socket.on("volume", function(value) {
      var v1 = (100 - value) / 100;
      var v2 = value / 100;
      gridLeft.fileSound.changeVolume(v2 < 0.5 ? v2 : 1);
      gridRight.fileSound.changeVolume(v1 < 0.5 ? v1 : 1);
    });
  });
});

function init() {
  $(document).on("grid-iter", function(ev, gid) {
    socket.emit("iter", gid);
  });
}

$(document).ready(init);

})();
