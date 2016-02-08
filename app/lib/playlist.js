var esr = require('escape-string-regexp');

var Track = require('./track').Track;

function Playlist(name, id) {
  var self = this;

  self.name = name;
  self.id = id;
  self.playlists = [];
  self.tracks = [];
}

Playlist.prototype.add_child = function(playlist) {
  this.playlists.push(playlist);
};

Playlist.prototype.add_track = function(track) {
  this.tracks.push(track);
};

Playlist.prototype.add_from_itunes = function(i_playlist) {
  var self = this;

  var playlist = new Playlist(i_playlist.Name, i_playlist['Playlist Persistent ID']);

  i_playlist.Tracks.forEach(function(i_track) {
    playlist.tracks.push(new Track(i_track.Location, i_track.Name, i_track.Artist));
  });

  var parent_id = i_playlist['Parent Persistent ID'];
  if (parent_id) {
    // console.log('Playlist:', playlist.name, 'has parent id', parent_id);
    var parent = self.search(parent_id);
    if (parent !== null) {
      // console.log('    parent found:', parent.name);
      parent.add_child(playlist);
    } else {
      // console.log('    parent not found');
    }
  } else {
    // console.log('Playlist:', playlist.name, 'has no parent, adding to', self.name);
    self.add_child(playlist);
  }
  // console.log('Playlist: adding', playlist.name, 'to', self.name);
  // self.add_child(playlist);
};

Playlist.prototype.search = function(id) {
  var self = this;

  if (self.id === id)
    return self;
  else
    return self.playlists.reduce(function(prev, curr) {
      if (prev !== null)
        return prev;
      else if (curr.id === id)
        return curr;
      else
        return curr.search(id);
    }, null);
};

Playlist.prototype.search_tracks = function(url) {
  var self = this;
  var results = [];
  // case insensitive regular expression to compare search_path with itunes paths
  var regex = new RegExp('^' + esr(url) + '$', 'i');

  self.tracks.forEach(function(track) {
    if (regex.test(track.url))
      results.push(self.name);
  });
  self.playlists.forEach(function(playlist) {
    var child_results = playlist.search_tracks(url);
    Array.prototype.push.apply(results, child_results);
  });
  return results;
};

Playlist.prototype.toString = function(level, id, depth) {
  var self = this;
  if (typeof level === 'undefined')
    level = 0;
  if (typeof depth === 'undefined')
    depth = 10;

  var str = (level > 0 ? '| '.repeat(level - 1) + '|-' : '') +
    self.name + (id ? ' (' + self.id + ')' : '');

  if (level < depth)
    self.playlists.forEach(function (playlist) {
      str = str.concat('\n', playlist.toString(level+1));
    });
  return str;
};

exports.Playlist = Playlist;