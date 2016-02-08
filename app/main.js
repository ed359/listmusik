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

  self.files_view = new FilesView(self.model, 
    $('#files-sidebar'), $('#files-addressbar'), $('#files-dialog') ,$('#files-table'));

  self.itunes_parser = new ItunesParser(function(playlist) {
    self.model.playlists_root.add_from_itunes(playlist);
    self.playlist_view.draw_tree();
  });

  self.playlist_view = new PlaylistView(self.model, $('#playlist-tree'), $('#playlist-table'));

  self.folder_reader = new FolderReader();

  self.files_view.on('load-subfolder', function () {
    // console.log("event: load-subfolder");

    self.model.subfolder_tracks = [];
    self.files_view.clear_table();
    
    self.folder_reader.read_subfolder(self.model.selected_subfolder.path, function(track) {
      track.playlists = self.model.playlists_root.search_tracks(track.url).join(', ');
      self.model.subfolder_tracks.push(track);
      self.files_view.add_to_table(track);
    });
  });

  self.files_view.on('addressbar-navigate', function(path) {
    // console.log("event: addressbar-navigate", path);
    self.model.root_folder = path;

    // remove old data from the model
    self.model.subfolders = [];
    self.model.selected_subfolder = null;
    self.model.subfolder_tracks = [];

    // draw the empty data to the sidebar
    self.files_view.draw_sidebar();

    self.folder_reader.read_root_folder(self.model.root_folder, function(subfolder) {
      self.model.subfolders.push(subfolder);
      self.files_view.draw_sidebar();
    });
  });

  self.files_view.on('dialog-navigate', function(path) {
    // console.log("event: dialog-navigate", path);
    self.model.root_folder = path;

    // remove old data from the model
    self.model.subfolders = [];
    self.model.selected_subfolder = null;
    self.model.subfolder_tracks = [];

    // draw the empty data to the sidebar
    self.files_view.draw_sidebar();

    self.folder_reader.read_root_folder(self.model.root_folder, function(subfolder) {
      self.model.subfolders.push(subfolder);
      self.files_view.draw_sidebar();
    });
    self.files_view.addressbar_set_root();
  });

  self.itunes_parser.parse();
  self.folder_reader.read_root_folder(self.model.root_folder, function(subfolder) {
    self.model.subfolders.push(subfolder);
    self.files_view.draw_sidebar();
  });

}

$(document).ready(function() {

  this.app = new App();

  gui.Window.get().show();
});
