var path = require('path');

function Track(url, title, artist) {
  var self = this;

  self.url = url;
  self.filename = decodeURI(path.basename(url));
  self.title = title;
  self.artist = artist;
  self.playlists = '';
}

exports.Track = Track;