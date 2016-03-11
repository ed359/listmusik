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

exports.Track = Track;
