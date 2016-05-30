global.$ = $;

var events = require('events');
var fs = require('fs');
var gui = require('nw.gui');
var itunes = require('itunes-data');
var path = require('path');
var util = require('util');
var _ = require('lodash');

var Exporter = require('./lib/exporter').Exporter;
var FilesView = require('./lib/files_view').FilesView;
var FolderReader = require('./lib/folder_reader').FolderReader;
var ItunesParser = require('./lib/itunes_parser').ItunesParser;
var NmlParser = require('./lib/nml_parser').NmlParser;
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
    root_folder: '~/Music'.replace('~', process.env.HOME),
    subfolders: [],
    selected_subfolder: null,
    subfolder_tracks: [],
    itunes_playlists_root: new Playlist('iTunesPlaylists', 'ROOT'),
    traktor_playlists_root: new Playlist('TraktorPlaylists', 'ROOT')
  };

  function clear_itunes_playlists () {
    self.model.itunes_playlists_root = new Playlist('iTunesPlaylists', 'ROOT');
    itunes_playlist_view.clear();
  }
  function clear_traktor_playlists () {
    self.model.traktor_playlists_root = new Playlist('TraktorPlaylists', 'ROOT');
    traktor_playlist_view.clear();
  };

  // Files_view callbacks depend on folder_reader so load it first
  var folder_reader = new FolderReader();

  // Load the exporter
  var exporter_dom = {
    addressbar: $('#exp-addressbar'),
    dialog: $('#exp-root-dialog'),
    itunes_btn: $('#exp-itunes'),
    traktor_btn: $('#exp-traktor'),
    verify_toggle: $('#exp-verify-toggle')
  };

  var exporter = new Exporter(self.model, exporter_dom);

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
      //track.playlists = self.model.playlists_root.search_tracks(track.url).join(', ');
      track.playlists = "feature disabled...";
      self.model.subfolder_tracks.push(track);
      files_view.add_to_table(track);
    });
  };

  var files_view = new FilesView(self.model, files_dom, load_subfolder_cb, load_root_folder_cb);

  var itunes_playlist_cb = function (playlist) {
    self.model.itunes_playlists_root.add_to_subtree(playlist);
    itunes_playlist_view.draw_tree();
  };
  var itunes_parser = new ItunesParser(itunes_playlist_cb);
  var itunes_playlist_view = new PlaylistView(self.model.itunes_playlists_root,
    $('#playlist-tree'), $('#playlist-table'));

  var traktor_end_cb = function(playlists_root) {
    // console.log('TraktorParser returned root');
    self.model.traktor_playlists_root = playlists_root;
    traktor_playlist_view.draw_tree();
  };
  var nml_parser = new NmlParser(self.model.traktor_playlists_root, traktor_end_cb);
  var traktor_playlist_view = new PlaylistView(self.model.traktor_playlists_root,
    $('#traktor-playlist-tree'), $('#traktor-playlist-table'), {table_view: ['path']});

  $('#adv-open-devtools').click(function (e) {
    gui.Window.get().showDevTools();
  });

  $('#adv-itunes-parse').click(function (e) {
    clear_itunes_playlists();
    itunes_parser.parse();
  });

  $('#adv-itunes-dialog').unbind('change');
  $('#adv-itunes-dialog').change(function ( e) {
    var selected_path = $(this).val();
    if (selected_path) {
      clear_itunes_playlists();
      itunes_parser.set_xml_path(selected_path);
      itunes_parser.parse();
    }
  });

  $('#adv-traktor-parse').click(function (e) {
    clear_traktor_playlists();
    nml_parser.parse();
  });

  $('#adv-traktor-dialog').unbind('change');
  $('#adv-traktor-dialog').change(function ( e) {
    var selected_path = $(this).val();
    if (selected_path) {
      clear_traktor_playlists();
      nml_parser.set_xml_path(selected_path);
      nml_parser.parse();
    }
  });

  $('#adv-verbose-toggle').bootstrapToggle();
  $('#adv-verbose-toggle').change(function() {
    var checked = $(this).prop('checked');
    itunes_parser.verbose = checked;
    Playlist.verbose = checked;
  });

  itunes_parser.parse();
  nml_parser.parse();

}

var app = new App();

$(document).ready(function () {
  gui.Window.get().show();
});
