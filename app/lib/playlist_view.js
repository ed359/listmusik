var jade = require('jade');

function gen_node (playlist) {
  var node = {
    text: playlist.name,
    id: playlist.id,

    // Icon: "glyphicon glyphicon-th-list",
    // selectedIcon: "glyphicon glyphicon-th-list",
    // color: "#000000",
    // backColor: "#FFFFFF",
    // href: "#node-1",
    selectable: true,

    // State: {
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
      '  td #{track.url}'
  ].join('\n'));

// Our type
function PlaylistView (model, playlists_root, playlist_tree, playlist_table) {
  var self = this;

  self.model = model;
  self.playlists_root = playlists_root;
  self.playlist_tree = playlist_tree;
  self.playlist_table = playlist_table;
  self.selected_playlist = null;

  self.gen_tree_data = function(playlists_root) {
    var data = gen_node(playlists_root).nodes;
    return {
      data: data,
      enableLinks: true,
      levels: 4,
      expandIcon: 'glyphicon glyphicon-th-list',
      collapseIcon: 'glyphicon glyphicon-th-list',
      onNodeSelected: self.nodeSelectedHandler,
      onNodeUnselected: self.nodeUnselectedHandler,
      color: '#337ab7',
      backColor: '#eeeeee',
      borderColor: '#e3e3e3'
    };
  };

  self.add_to_table = function(track) {

    // Console.log("adding ", track.title)
    self.playlist_table.children('tbody').append(gen_file_entry({ track: track }));
  };

  self.draw_tree = function() {
    self.playlist_tree.treeview(self.gen_tree_data(self.playlists_root));
  };

  self.draw_table = function() {
    self.playlist_table.children('tbody').empty();
    if (self.selected_playlist !== null) {

      // Console.log("drawing ", self.model.selected_playlist.name)
      self.selected_playlist.tracks.forEach(self.add_to_table);

      // Self.playlist_table.DataTable({
      //   paging: false,
      //   searching: false,
      // });
    }

    // Else
    //   console.log("drawing nothing")
  };

  self.nodeSelectedHandler = function(event, node) {

    // Console.log("node selected:", node.text);
    var search_id = node.id;
    self.selected_playlist = self.playlists_root.search(search_id);
    self.draw_table();
  };

  self.nodeUnselectedHandler = function(event, node) {

    // Console.log("node unselected:", node.text);
    self.clear_table();
  };

  self.clear_table = function() {
    self.selected_playlist = null;
    self.draw_table();
  };

  self.draw_tree();
  self.draw_table(self.selected_playlist);

}

exports.PlaylistView = PlaylistView;
