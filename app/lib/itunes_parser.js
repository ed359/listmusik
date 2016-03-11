'use strict';
var fs = require('fs');
var itunes = require('itunes-data');
var _ = require('lodash');

var Playlist = require('./playlist').Playlist;
var Track = require('./track').Track;

// Our type
function ItunesParser (playlist_cb, options) {
  var self = this;

  if (options && typeof options.verbose !== 'undefined')
    self.verbose = options.verbose;
  else
    self.verbose = false;
  if (options && options.xml_path)
    self.xml_path = options.xml_path;
  else
    self.xml_path = '~/Music/iTunes/iTunes Music Library.xml'.replace('~', process.env.HOME);

  self.playlist_cb = playlist_cb;
  self.stream = null;
  self.parser_running = false;
  self.ignored_playlists = [
    'Library',
    'Music',
    'Movies',
    'Podcasts',
    'TV Shows',
    'Audiobooks',
    'Books',
    'Purchased',
    'Apps',
    'iTunes\u00A0U',
    '####!####',
    'Home Videos',
    'Genius',
    'All Songs',
    'Unplayed'
  ];

  // Dictionary objects provide references to track and playlisy objects by ID
  self.tracks_by_id = {};
  self.playlists_by_id = {};
}

ItunesParser.prototype.init_parser = function () {
  var self = this;

  self.parser = itunes.parser();

  self.parser.on('end', function () {
    if (self.verbose)
      console.log('ItunesParser completed parsing');
    self.stream.unpipe();
    self.parser_running = false;
  });

  self.parser.on('track', function (track) {

    // if (self.verbose)
    //   console.log('ItunesParser found track', track);
    self.tracks_by_id[ track[ 'Track ID' ] ] = track;
  });

  self.parser.on('playlist', function (i_playlist) {
    if (self.verbose)
      console.log('ItunesParser found playlist', i_playlist.Name);

    if (_.includes(self.ignored_playlists, i_playlist.Name) || !i_playlist[ 'Playlist Items' ]) {
      return;
    }

    i_playlist.Tracks = i_playlist[ 'Playlist Items' ].map(function (track_entry, index) {
      var track = self.tracks_by_id[ track_entry[ 'Track ID' ] ];
      if (typeof track === 'undefined') {
        console.error('Finding track entry', index, 'with ID',
          track_entry[ 'Track ID' ], 'in playlist', i_playlist.Name, 'failed');
        return { Location: 'track in ' + i_playlist.Name, Name: 'Broken track', Artist: 'Broken' };
      } else {
        return track;
      }
    });

    // TODO delete lots of non-useful data
    delete i_playlist[ 'Playlist Items' ];
    var playlist = self.convert_from_itunes(i_playlist);

    self.playlist_cb(playlist);
  });
};

ItunesParser.prototype.set_xml_path = function(path) {
  var self = this;
  self.xml_path = path;
};

ItunesParser.prototype.parse = function() {
  var self = this;
  if (self.parser_running) {
    if (self.verbose)
      console.error('ItunesParser parser already running');
    self.parser.stop();
  }
  if (self.stream) {
    if (self.verbose)
      console.log('ItunesParser stream exists');
    self.stream.unpipe();
    self.stream.destroy();
  }
  if (self.verbose)
    console.log('ItunesParser parsing', self.xml_path);

  self.stream = fs.createReadStream(self.xml_path);

  if (self.verbose)
    console.log('ItunesParser stream', self.stream.path);

  self.parser_running = true;
  self.init_parser();
  self.stream.pipe(self.parser);
};

ItunesParser.prototype.convert_from_itunes = function(i_playlist) {
  var playlist = new Playlist(i_playlist.Name, i_playlist[ 'Playlist Persistent ID' ]);

  i_playlist.Tracks.forEach(function(i_track) {
    playlist.tracks.push(new Track(i_track.Location, i_track.Name, i_track.Artist));
  });

  var parent_id = i_playlist[ 'Parent Persistent ID' ];
  if (parent_id)
    playlist.parent_id = parent_id;

  return playlist;
};

exports.ItunesParser = ItunesParser;
