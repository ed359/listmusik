'use strict';
var esr = require('escape-string-regexp');

var Track = require('./track').Track;

function Playlist (name, id) {
  var self = this;

  self.name = name;
  self.id = id;
  self.parent_id = null;
  self.playlists = [];
  self.tracks = [];
}

Playlist.prototype.add_child = function (playlist) {
  this.playlists.push(playlist);
};

Playlist.prototype.add_track = function (track) {
  this.tracks.push(track);
};

Playlist.prototype.add_to_subtree = function (playlist) {
  var self = this;

  if (playlist.parent_id) {

    // Console.log('Playlist:', playlist.name, 'has parent id', parent_id);
    var parent = self.search(playlist.parent_id);
    if (parent !== null) {

      // Console.log('    parent found:', parent.name);
      parent.add_child(playlist);
    } else {

      // Console.log('    parent not found');
    }
  } else {

    // Console.log('Playlist:', playlist.name, 'has no parent, adding to', self.name);
    self.add_child(playlist);
  }

  // Console.log('Playlist: adding', playlist.name, 'to', self.name);
  // self.add_child(playlist);
};

// Playlist.prototype.add_from_itunes = function (i_playlist) {
//   var self = this;

//   Var playlist = new Playlist(i_playlist.Name, i_playlist[ 'Playlist Persistent ID' ]);

//   I_playlist.Tracks.forEach(function (i_track) {

//     // Try {
//     playlist.tracks.push(new Track(i_track.Location, i_track.Name, i_track.Artist));

//     // }
//     // catch (e) {
//     //   console.error('Processing playlist', i_playlist.Name, 'failed at track', i_track);
//     // }
//   });

//   Var parent_id = i_playlist[ 'Parent Persistent ID' ];
//   if (parent_id) {

//     // Console.log('Playlist:', playlist.name, 'has parent id', parent_id);
//     var parent = self.search(parent_id);
//     if (parent !== null) {

//       // Console.log('    parent found:', parent.name);
//       parent.add_child(playlist);
//     } else {

//       // Console.log('    parent not found');
//     }
//   } else {

//     // Console.log('Playlist:', playlist.name, 'has no parent, adding to', self.name);
//     self.add_child(playlist);
//   }

//   // Console.log('Playlist: adding', playlist.name, 'to', self.name);
//   // self.add_child(playlist);
// };

Playlist.prototype.search = function (id) {
  var self = this;

  if (self.id === id)
    return self;
  else
    return self.playlists.reduce(function (prev, curr) {
      if (prev !== null)
        return prev;
      else if (curr.id === id)
        return curr;
      else
        return curr.search(id);
    }, null);
};

Playlist.prototype.search_tracks = function (url) {
  var self = this;
  var results = [];

  // Case insensitive regular expression to compare search_path with itunes paths
  var regex = new RegExp('^' + esr(url) + '$', 'i');

  self.tracks.forEach(function (track) {
    if (regex.test(track.url))
      results.push(self.name);
  });
  self.playlists.forEach(function (playlist) {
    var child_results = playlist.search_tracks(url);
    Array.prototype.push.apply(results, child_results);
  });
  return results;
};

Playlist.prototype.toString = function (level, id, depth) {
  var self = this;
  if (typeof level === 'undefined')
    level = 0;
  if (typeof depth === 'undefined')
    depth = 10;

  var str = (level > 0 ? '| '.repeat(level - 1) + '|-' : '') +
    self.name + (id ? ' (' + self.id + ')' : '');

  if (level < depth)
    self.playlists.forEach(function (playlist) {
      str = str.concat('\n', playlist.toString(level + 1));
    });
  return str;
};

Playlist.prototype.toM3u = function (track_cb) {
  if (typeof track_cb === 'undefined') {
    track_cb = function (path) { return path; };
  }
  var self = this;
  var filename = self.name + '.m3u';
  var data = self.tracks.map(function (track) {
    return track_cb(track.get_path());
  });
  var length = data.length;
  return {
    filename: filename,
    data: data.join('\n'),
    length: length
  };
}

Playlist.verbose = true;

exports.Playlist = Playlist;
