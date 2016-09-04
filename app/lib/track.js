var file_url = require('file-url');
var path = require('path');

function Track (track_path, title, artist) {
  var self = this;

  if (typeof track_path === 'undefined') {
    throw new Error('Track must be instantiated with an absolute path');
  }

  self.path = track_path;
  self.url = file_url(track_path);
  self.title = '';
  self.artist = '';
  self.playlists = '';

  if (typeof title !== 'undefined')
    self.title = title;
  if (typeof artist !== 'undefined')
    self.artist = artist;

  self.playlists = '';
}

Track.prototype.get_relative_path = function(root) {
    var self = this;
    return path.relative(root, self.path);
};

Track.prototype.get_path = function() {
  var self = this;
  return self.path;
};

exports.Track = Track;
