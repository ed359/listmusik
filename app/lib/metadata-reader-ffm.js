var ffm = require('ffmetadata');
var file_url = require('file-url');
var path = require('path');
var _ = require('lodash');

var Track = require('./track').Track;

function MetadataReader () {
  var self = this;
}

function unescape_ffm_string (str) {
  if (typeof str === 'undefined')
    str = '';

  // Hack to find escaped html with the trailing ';' itself escaped by a '\'
  return _.unescape(str.replace('\\;', ';'));
}

MetadataReader.prototype.read = function(file_path, callback) {
  var self = this;
  var url = file_url(file_path); // Resolves 'path' to an absolute path before URI encoding
  var track = new Track(file_url(file_path));

  ffm.read(file_path, function(error, metadata) {
    if (error) {
      console.error('Error reading metadata in ' + path.basename(file_path), error);
    } else {
      track.title = unescape_ffm_string(metadata.title);
      track.artist = unescape_ffm_string(metadata.artist);
    }

    callback(track);
  });

};

exports.MetadataReader = MetadataReader;
