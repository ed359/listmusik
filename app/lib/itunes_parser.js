var fs = require ('fs');
var itunes = require('itunes-data');
var _ = require('lodash');

var Playlist = require('./playlist').Playlist;

// Our type
function ItunesParser(playlist_cb, options) {  
  var self = this;

  if (options && options.itunes_xml_path)
    self.itunes_xml_path = options.itunes_xml_path;
  else
    self.itunes_xml_path = '~/Music/iTunes/iTunes Music Library.xml'.replace('~', process.env.HOME);

  self.playlist_cb = playlist_cb;
}

ItunesParser.prototype.parse = function() {
  var self = this;
  var stream = fs.createReadStream(self.itunes_xml_path);
  var parser = itunes.parser();
  var tracks_by_id = {};
  var playlists_by_id = {};
  var ignored_playlists = [
    "Library",
    "Music",
    "Movies",
    "Podcasts",
    "TV Shows",
    "Audiobooks",
    "Books",
    "Purchased",
    "Apps",
    "iTunes\u00A0U",
    "####!####",
    "Home Videos",
    "Genius",
    "All Songs",
    "Unplayed"
  ];

  parser.on("track", function(track) {
    tracks_by_id[track["Track ID"]] = track;
  });

  parser.on("playlist", function(playlist) {

    if (_.includes(ignored_playlists, playlist.Name) || !playlist["Playlist Items"]) {
      return;
    }

    playlist.Tracks = playlist["Playlist Items"].map(function(track) {
      return tracks_by_id[track["Track ID"]];
    });

    // TODO delete lots of non-useful data
    delete playlist["Playlist Items"];

    self.playlist_cb(playlist);
  });

  stream.pipe(parser);
};

exports.ItunesParser = ItunesParser; 
