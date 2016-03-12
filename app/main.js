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
var TraktorParser = require('./lib/nml_parser').init_parser;
var Playlist = require('./lib/playlist').Playlist;
var PlaylistView = require('./lib/playlist_view').PlaylistView;

// Extend application menu for Mac OS
if (process.platform == 'darwin') {
  var menu = new gui.Menu({ type: 'menubar' });
  if (menu.createMacBuiltin)
    menu.createMacBuiltin(window.document.title);
  gui.Window.get().menu = menu;
}

function App () {
  var self = this;

  self.model = {
    root_folder: '/Volumes/MiniDrive/Music',
    subfolders: [],
    selected_subfolder: null,
    subfolder_tracks: [],
    playlists_root: new Playlist('Root', 'ROOT'),
    traktor_playlists_root: new Playlist('Root', 'ROOT'),
    selected_playlist: null,
    clear_playlists: function () {
      this.playlists_root = new Playlist('Root', 'ROOT');
      this.selected_playlist = null;
    }
  };

  // Files_view callbacks depend on folder_reader so load it first
  var folder_reader = new FolderReader();

  var files_dom = {
    addressbar: $('#files-addressbar'),
    dialog: $('#files-dialog'),
    sidebar: $('#files-sidebar'),
    table: $('#files-table')
  };

  var load_root_folder_cb = function (root_path) {
    self.model.root_folder = root_path;

    // Remove old data from the model
    self.model.subfolders = [];
    self.model.selected_subfolder = null;
    self.model.subfolder_tracks = [];

    folder_reader.read_root_folder(self.model.root_folder, function (subfolder) {
      self.model.subfolders.push(subfolder);
      files_view.draw_sidebar();
    });
  };

  var load_subfolder_cb = function (subfolder_path) {
    self.model.subfolder_tracks = [];

    folder_reader.read_subfolder(subfolder_path, function (track) {
      track.playlists = self.model.playlists_root.search_tracks(track.url).join(', ');
      self.model.subfolder_tracks.push(track);
      files_view.add_to_table(track);
    });
  };

  var files_view = new FilesView(self.model, files_dom, load_subfolder_cb, load_root_folder_cb);

  var playlist_cb = function (playlist) {
    self.model.playlists_root.add_to_subtree(playlist);
    playlist_view.draw_tree();
  };
  var itunes_parser = new ItunesParser(playlist_cb);
  var playlist_view = new PlaylistView(self.model, self.model.playlists_root, 
    $('#playlist-tree'), $('#playlist-table'));

  var itunes_parser = new ItunesParser(playlist_cb);
  var traktor_playlist_view = new PlaylistView(self.model, self.model.traktor_playlists_root, 
    $('#traktor-playlist-tree'), $('#traktor-playlist-table'));

  $('#adv-open-devtools').click(function (e) {
    gui.Window.get().showDevTools();
  });

  $('#adv-itunes-parse').click(function (e) {
    self.model.clear_playlists();
    itunes_parser.parse();
  });

  $('#adv-itunes-dialog').unbind('change');
  $('#adv-itunes-dialog').change(function ( e) {
    var selected_path = $(this).val();
    if (selected_path) {
      self.model.clear_playlists();
      itunes_parser.set_xml_path(selected_path);
      itunes_parser.parse();
    }
  });

  $('#adv-verbose-toggle').bootstrapToggle();
  $('#adv-verbose-toggle').change(function() {
    var checked = $(this).prop('checked');
    itunes_parser.verbose = checked;
    Playlist.verbose = checked;
  });

  itunes_parser.parse();

  var nmlparser = TraktorParser(self.model.traktor_playlists_root);
  var stream = fs.createReadStream('../test/collection.nml');
  
  nmlparser.on('end', function() {
    console.log('TraktorParser completed parsing');
    stream.unpipe();
  });

  nmlparser.on('playlists_root', function(playlists_root) {
    console.log('TraktorParser returned root');
    traktor_playlist_view.draw_tree();
    //console.log(JSON.stringify(playlists_root));
  });

  stream.pipe(nmlparser);
}

var app = new App();

$(document).ready(function () {
  gui.Window.get().show();
});
