var path = require("path");
var fs = require("fs");

function SoundFile() {
}

SoundFile.prototype.loadSync = function(basePath) {
  var soundList = [];
  var fileList = fs.readdirSync(basePath);
  var id = 0;

  for(var i = 0; i < fileList.length; i++) {
    var filename = path.join(basePath, fileList[i]);
    var stat = fs.statSync(filename);

    if(stat.isDirectory()) {
      soundList.push({
        id: id,
        name: fileList[i],
        filelist: fs.readdirSync(filename).map(function(sound) {
          return path.join("sounds", fileList[i], sound);
        })
      });

      id++;
    }
  }

  return soundList;
};

module.exports = SoundFile;
