global.$ = $;

var esr = require('escape-string-regexp');
var events = require('events');
var ffm = require("ffmetadata");
var file_url = require('file-url');
var fs = require('fs');
var gui = require('nw.gui');
var itunes = require("itunes-data");
var path = require('path');
var util = require('util');
var _ = require('lodash');

var pview = require('./lib/playlist_view');
var fview = require('./lib/files_view');

// itunes ontology logic
function strip_playlist_data(playlist) {
  var stripped_playlist = {
    name: playlist.Name,
    tracks: [],
    parent: undefined
  };
  if (playlist.Parent) {
    // console.log("Playlist:", playlist.Name, "Parent:", playlist.Parent);
    stripped_playlist.parent = playlist.Parent;
  }
  else {
    // console.log("No Parent for playlist: ", playlist.Name);
  }
  _.each(playlist.Tracks, function(track) {
    stripped_playlist.tracks.push({
      filename: track.Location,
      title: track.Name,
      artist: track.Artist
    });
  }); 
  return stripped_playlist;
}

// file reading logic
var music_extensions = [ '.mp3' ];
function is_music_file(file) {
  if (_.includes(music_extensions, path.extname(file).toLowerCase()) && !/^\./.test(file)) 
    return true;
  else 
    return false;
}

function unescape_track_data(data) {
  // hack to find escaped html with the trailing ';' itself escaped by a '\'
  if (data && typeof data.title !== "undefined")
    data.title = _.unescape(data.title.replace('\\;',';'));
  if (data && typeof data.artist !== "undefined")
    data.artist = _.unescape(data.artist.replace('\\;',';'));
  return data;
}

// Extend application menu for Mac OS
if (process.platform == "darwin") {
  var menu = new gui.Menu({type: "menubar"});
  if(menu.createMacBuiltin)
    menu.createMacBuiltin(window.document.title);
  gui.Window.get().menu = menu;
}

function App() {
  var self = this;

  self.model = {
    root_folder: '/Volumes/MiniDrive/Music',
    subfolders: [],
    subfolder: undefined,
    subfolder_tracks: [],
    selected_playlist: undefined,
    playlists: [],
  };

}

App.prototype.read_itunes_playlists = function() {
  var self = this;
  var itunes_xml_path = '~/Music/iTunes/iTunes Music Library.xml'.replace('~', process.env.HOME);
  var stream = fs.createReadStream(itunes_xml_path);
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
    // console.log("playlists_by_id")
    // _.each(playlists_by_id, function(playlist, id) {
    //   console.log(id, playlist.Name);
    // });
    playlists_by_id[playlist["Playlist Persistent ID"]] = playlist;

    if (_.includes(ignored_playlists, playlist.Name) || !playlist["Playlist Items"]) {
      return;
    }
    if (playlist["Parent Persistent ID"]) {
      playlist.Parent = playlists_by_id[playlist["Parent Persistent ID"]].Name;
    }
    playlist.Tracks = playlist["Playlist Items"].map(function(track) {
      return tracks_by_id[track["Track ID"]];
    });
    delete playlist["Playlist Items"];

    var stripped_playlist = strip_playlist_data(playlist);

    // this updates the models in the views too since objects are passed by reference
    self.model.playlists.push(stripped_playlist);
    self.playlist_view.add_playlist(stripped_playlist);
  });

  stream.pipe(parser);
};

App.prototype.read_root_folder = function() {
  var self = this;

  fs.readdir(self.model.root_folder, function(error, files) {
    if (error) {
      console.log(error);
      window.alert(error);
      return;
    }

    _.each(files, function(file) {
      var full_path = path.join(self.model.root_folder, file);
      var filestat = fs.statSync(full_path);
      if (filestat.isDirectory() && !/^\./.test(file)) {
        self.model.subfolders.push({path: full_path, name: file});
        self.files_view.draw_sidebar();
      }
    });
  });
};

App.prototype.load_subfolder = function() {
  
  var self = this;
  // console.log(self.constructor.name);
  self.files_view.clear_table();
  self.model.subfolder_tracks = [];

  fs.readdir(self.model.subfolder.path, function(fs_error, files) {
    if (fs_error) {
      console.log(fs_error);
      window.alert(fs_error);
      return;
    }
    files = _.filter(files, is_music_file);

    _.forEach(files, function(file) {
      var full_path = path.join(self.model.subfolder.path, file);
      var search_path = file_url(full_path);
      ffm.read(full_path, function(ffm_error, track_data) {
        if (ffm_error) {
          console.error("Error reading metadata in " + file, ffm_error);
          track_data = {filename: file, path: full_path};
        }
        else {
          track_data.filename = file;
          track_data.path = full_path;
        }

        track_data.playlists = self.playlist_search(search_path).join(', ');
        track_data = unescape_track_data(track_data);

        // push to model and update view
        self.model.subfolder_tracks.push(track_data);
        self.files_view.add_to_table(track_data);
      });
    });
  });
};

App.prototype.playlist_search = function (path) {
  var self = this;
  var containing_playlists = [];
  // case insensitive regular expression to compare search_path with itunes paths
  var regex = new RegExp('^' + esr(path) + '$', 'i');
  _.forEach(self.model.playlists, function(playlist) {
    _.forEach(playlist.tracks, function(track) {
      if (regex.test(track.filename))
        containing_playlists.push(playlist.name);
    });
  });
  return containing_playlists;
}

$(document).ready(function() {

  var app = new App();

  app.playlist_view = new pview.PlaylistView(app.model, 
    $('#playlist-sidebar'), $('#playlist-tree'), $('#playlist-table'));
  app.files_view = new fview.FilesView(app.model, 
    $('#files-sidebar'), $('#files-addressbar'), $('#files-table'));

  app.files_view.on('loadSubfolder', function () {
    app.load_subfolder();
  });

  app.read_itunes_playlists();
  app.read_root_folder();

  gui.Window.get().show();
});
