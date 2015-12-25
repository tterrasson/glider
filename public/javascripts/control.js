"use strict";

(function() {

var socket = io.connect();

socket.on("connect", function() {
  socket.emit("hello", function(err, mixer) {
    var patternLeft = new libgrid.ControlGrid("gid-1", "#wrapper-pattern-left", "pattern-left", 16);
    var patternRight = new libgrid.ControlGrid("gid-2", "#wrapper-pattern-right", "pattern-right", 16);

    patternLeft.init(mixer["gid-1"].pattern);
    patternRight.init(mixer["gid-2"].pattern);

    $("#play-btn-left").click(function() {
      socket.emit("seed", "gid-1");
    });

    $("#stop-btn-left").click(function() {
      patternLeft.clear();
      socket.emit("clear", "gid-1");
    });

    $("#play-btn-right").click(function() {
      socket.emit("seed", "gid-2");
    });

    $("#stop-btn-right").click(function() {
      patternRight.clear();
      socket.emit("clear", "gid-2");
    });

    $("#speed-slider-left").on("change.fndtn.slider", $.throttle(100, function(ev) {
      var value = parseFloat($(this).attr("data-slider"));
      socket.emit("params", "gid-1", "speed", value);
    }));

    $("#speed-slider-right").on("change.fndtn.slider", $.throttle(100, function() {
      var value = parseFloat($(this).attr("data-slider"));
      socket.emit("params", "gid-2", "speed", value);
    }));

    $("#sound-select-left").change(function(ev) {
      socket.emit("params", "gid-1", "sound", $(this).val());
    });

    $("#sound-select-right").change(function(ev) {
      socket.emit("params", "gid-2", "sound", $(this).val());
    });

    $("#volume-slider").on("change.fndtn.slider", $.throttle(100, function() {
      var value = parseFloat($(this).attr("data-slider"));
      socket.emit("volume", value);
    }));

    socket.on("change", function(gid, cell) {
      if(gid === "gid-1") {
        patternLeft.setCell(cell.state, cell.x, cell.y);
      } else {
        patternRight.setCell(cell.state, cell.x, cell.y);
      }
    });

    socket.on("clear", function(gid) {
      if(gid === "gid-1") {
        patternLeft.clear();
      } else {
        patternRight.clear();
      }
    });

    socket.on("params", function(gid, type, value) {
      if(gid === "gid-1") {
        if(type === "speed") {
          $('#speed-slider-left').foundation('slider', 'set_value', value, false);
        } else if(type === "sound") {
          $("#sound-select-left").val(value);
        }
      } else {
        if(type === "speed") {
          $('#speed-slider-right').foundation('slider', 'set_value', value, false);
        } else if(type === "sound") {
          $("#sound-select-right").val(value);
        }
      }
    });

    /* send initial parameters */
    socket.emit("params", "gid-1", "speed", parseFloat($("#speed-slider-left").attr("data-slider")));
    socket.emit("params", "gid-2", "speed", parseFloat($("#speed-slider-right").attr("data-slider")));
    socket.emit("params", "gid-1", "sound", $("#sound-select-left").val());
    socket.emit("params", "gid-2", "sound", $("#sound-select-right").val());

    $(document).on("grid-change", function(ev, gid, cell) {
      socket.emit("change", gid, cell);
    });
  });
});

function init() {
}

$(document).ready(init);

})();
