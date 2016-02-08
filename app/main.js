global.$ = $;

var events = require('events');
var fs = require('fs');
var gui = require('nw.gui');
var itunes = require('itunes-data');
var path = require('path');
var util = require('util');
var _ = require('lodash');

var FilesView = require('./lib/files_view').FilesView;
var FolderReader = require('./lib/folder_reader').FolderReader;
var ItunesParser = require('./lib/itunes_parser').ItunesParser;
var Playlist = require('./lib/playlist').Playlist;
var PlaylistView = require('./lib/playlist_view').PlaylistView;

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
    selected_subfolder: null,
    subfolder_tracks: [],
    playlists_root: new Playlist('Root', 'ROOT'),
    selected_playlist: null
  };

  // files_view callbacks depend on folder_reader so load it first
  var folder_reader = new FolderReader();

  var files_dom = {
    addressbar: $('#files-addressbar'),
    dialog: $('#files-dialog'),
    sidebar: $('#files-sidebar'),
    table: $('#files-table')
  };

  var load_root_folder_cb = function(root_path) {
    self.model.root_folder = root_path;

    // remove old data from the model
    self.model.subfolders = [];
    self.model.selected_subfolder = null;
    self.model.subfolder_tracks = [];

    folder_reader.read_root_folder(self.model.root_folder, function(subfolder) {
      self.model.subfolders.push(subfolder);
      files_view.draw_sidebar();
    });
  };

  var load_subfolder_cb = function(subfolder_path) {    
    self.model.subfolder_tracks = [];
    
    folder_reader.read_subfolder(subfolder_path, function(track) {
      track.playlists = self.model.playlists_root.search_tracks(track.url).join(', ');
      self.model.subfolder_tracks.push(track);
      files_view.add_to_table(track);
    });
  };

  var files_view = new FilesView(self.model, files_dom, load_subfolder_cb, load_root_folder_cb);

  var itunes_parser = new ItunesParser(function(playlist) {
    self.model.playlists_root.add_from_itunes(playlist);
    playlist_view.draw_tree();
  });

  var playlist_view = new PlaylistView(self.model, $('#playlist-tree'), $('#playlist-table'));

  itunes_parser.parse();
}

var app = new App();

$(document).ready(function() {
  gui.Window.get().show();
});