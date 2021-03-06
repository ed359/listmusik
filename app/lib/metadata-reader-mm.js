var fs = require('fs');
var mm = require('musicmetadata');
var path = require('path');
var _ = require('lodash');

var Track = require('./track').Track;

function MetadataReader () {
  var self = this;
}

// Function unescape_ffm_string(str) {
//   if (typeof str === 'undefined')
//     str = '';
//   // hack to find escaped html with the trailing ';' itself escaped by a '\'
//   return _.unescape(str.replace('\\;',';'));
// }

MetadataReader.prototype.read = function(file_path, callback) {
  var self = this;
  var track = new Track(file_path);

  var parser = mm(fs.createReadStream(file_path), function(error, metadata) {
    if (error) {
      console.error('Error reading metadata in ' + path.basename(file_path), error);
    } else {
      track.title = metadata.title;
      track.artist = metadata.artist;
    }

    callback(track);
  });

};

exports.MetadataReader = MetadataReader;
