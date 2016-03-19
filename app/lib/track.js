var path = require('path');

function Track (url, title, artist) {
  var self = this;

  if (typeof url === 'undefined') {
    throw new Error('Track must be instantiated with a url');
  }

  self.url = url;
  self.filename = decodeURI(path.basename(url));
  self.title = '';
  self.artist = '';
  self.playlists = '';

  if (typeof title !== 'undefined')
    self.title = title;
  if (typeof artist !== 'undefined')
    self.artist = artist;

  self.playlists = '';
}

Track.prototype.get_relative_path = function (root) {
    var self = this;
    var abs_path = decodeURI(self.url);
    return path.relative(root, abs_path);
};

Track.prototype.get_path = function () {
  var self = this
  return decodeURI(self.url);
};

exports.Track = Track;
