"use strict";

var libaudio = libaudio || {};

libaudio.init = function() {
}

libaudio.FileSound = function(maxVoices) {
  var self = this;
  self.playId = 0;
  self.voices = {};
  self.maxVoices = maxVoices;
  self.volume = 1.0;
};

libaudio.FileSound.prototype.registerAll = function(soundList) {
  var self = this;

  for(var i = 0; i < soundList.length; i++) {
    for(var a = 0; a < self.maxVoices && a < soundList[i].filelist.length; a++) {
      var url = "/" + encodeURIComponent(soundList[i].filelist[a]);
      var key = soundList[i].id + "_" + parseInt(a);

      createjs.Sound.registerSound(url, key);
    }
  }
};

libaudio.FileSound.prototype.play = function(cell) {
  var self = this;
  var key = self.playId + "_" + cell.y;

  if(key in self.voices) {
    self.voices[key].stop();
    self.voices[key].play();
  } else {
    self.voices[key] = createjs.Sound.play(key);
    self.voices[key].volume = self.volume;
  }
};

libaudio.FileSound.prototype.stop = function(cell) {
  var self = this;
  var key = self.playId + "_" + cell.y;

  if(key in self.voices) {
    self.voices[key].stop();
  }
};

libaudio.FileSound.prototype.stopAll = function() {
  createjs.Sound.stop();
};

libaudio.FileSound.prototype.changeSound = function(id) {
  var self = this;
  self.playId = id;
};

libaudio.FileSound.prototype.changeVolume = function(value) {
  var self = this;

  for(var key in self.voices) {
     self.voices[key].volume = value;
  }

  self.volume = value;
};
