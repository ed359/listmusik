var events = require('events');
var jade = require('jade');
var util = require('util');
var _ = require('lodash');

function gen_node(playlist) {
  var node = {
    text: playlist.name,
    id: playlist.id,
    // icon: "glyphicon glyphicon-th-list",
    // selectedIcon: "glyphicon glyphicon-th-list",
    // color: "#000000",
    // backColor: "#FFFFFF",
    // href: "#node-1",
    selectable: true,
    // state: {
    //   checked: true,
    //   disabled: true,
    //   expanded: true,
    //   selected: true
    // },
    // tags: ['available'],
    nodes: playlist.playlists.map(gen_node)
  };
  return node;
}

var gen_file_entry = jade.compile([
      'tr',
      '  td #{track.title}',
      '  td #{track.artist}',
      '  td #{track.url}',
  ].join('\n'));

// Our type
function PlaylistView(model, playlist_tree, playlist_table) {  
  var self = this;

  self.model = model;

  self.playlist_tree = playlist_tree;
  self.playlist_table = playlist_table;

  self.gen_tree_data = function(playlists_root) {
    var data = gen_node(playlists_root).nodes;
    return {
      data: data,
      enableLinks: true, 
      levels: 4,
      expandIcon: "glyphicon glyphicon-th-list",
      collapseIcon: "glyphicon glyphicon-th-list",
      onNodeSelected: self.nodeSelectedHandler,
      onNodeUnselected: self.nodeUnselectedHandler,
      color: "#337ab7",
      backColor: "#eeeeee",
      borderColor: "#e3e3e3",
    };
  };

  self.add_to_table = function(track) {
    // console.log("adding ", track.title)
    self.playlist_table.children("tbody").append(gen_file_entry({track: track}));
  };

  self.draw_tree = function() {
    self.playlist_tree.treeview(self.gen_tree_data(self.model.playlists_root));
  };

  self.draw_table = function() {
    self.playlist_table.children("tbody").empty();
    if (self.model.selected_playlist !== null) {
      // console.log("drawing ", self.model.selected_playlist.name)
      _.forEach(self.model.selected_playlist.tracks, self.add_to_table);
      // self.playlist_table.DataTable({
      //   paging: false,
      //   searching: false,
      // });
    }
    // else
    //   console.log("drawing nothing")
  };

  self.draw_tree();
  self.draw_table(model.selected_playlist);

  self.nodeSelectedHandler = function(event, node) {
    // console.log("node selected:", node.text);
    var search_id = node.id;
    var selected_playlist = self.model.playlists_root.search(search_id);
    self.model.selected_playlist = selected_playlist;
    self.draw_table();
  };

  self.nodeUnselectedHandler = function(event, node) {
    // console.log("node unselected:", node.text);
    self.model.selected_playlist = null;
    self.draw_table();
  };
}

util.inherits(PlaylistView, events.EventEmitter);

exports.PlaylistView = PlaylistView; 
