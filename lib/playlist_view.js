var events = require('events');
var jade = require('jade');
var util = require('util');
var _ = require('lodash');

// Our type
function PlaylistView(model, playlist_tree, playlist_table) {  
  var self = this;

  self.model = model;

  // self.playlist_sidebar = playlist_sidebar;
  self.playlist_tree = playlist_tree;
  self.playlist_table = playlist_table;
  
  // self.gen_sidebar_entry = jade.compile([
  //   'li',
  //   '  a(href="#", data-name="#{playlist.name}")',
  //   '    | #{playlist.name}'
  // ].join('\n'));

  self.gen_file_entry = jade.compile([
      'tr',
      '  td #{track.title}',
      '  td #{track.artist}',
      '  td #{track.filename}',
  ].join('\n'));

  self.gen_node = function (playlist) {
    return {
      text: playlist.name,
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
      nodes: []
    };
  };

  self.search_tree = function (tree, name) {
    // if (typeof tree === 'undefined') {
    //   return undefined;
    // }
    // .slice() copies the array so the .shift() it doesn't remove from the original array
    var nodes = tree.slice();
    var node = nodes.shift();
    if (typeof node === 'undefined') {
      return undefined;
    } else if (node.text == name) {
      return node;
    } else {
      var subtree_result = self.search_tree(node.nodes, name);
      if (typeof subtree_result !== 'undefined') {
        return subtree_result;
      }
      else {
        return self.search_tree(nodes, name);
      }
    }
    console.log("search fail");
  };

  self.gen_tree_data = function () {
    var playlists = self.model.playlists;
    var tree = [];
    _.each(playlists, function(playlist) {
      var new_node = self.gen_node(playlist);
      if (typeof playlist.parent === 'undefined') {
        tree.push(new_node);
        // console.log(JSON.stringify(tree, null, 2));
      }
      else {
        var parent_node = self.search_tree(tree, playlist.parent);
        if (typeof parent_node !== 'undefined') {
          parent_node.nodes.push(new_node);
        }
        else {
          // console.log("Parent:", playlist.parent, "not found for:", playlist.name);
          tree.push(new_node);
        }
      }
    });
    return {
      data: tree, 
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

  // self.add_to_sidebar = function (playlist) {
  //   self.playlist_sidebar.append(self.gen_sidebar_entry({playlist: playlist}));
  // };

  self.add_playlist = function (playlist) {
    // console.log(JSON.stringify(self.model.playlists.map(function (playlist) {
    //   var clone = _.clone(playlist);
    //   delete clone.tracks;
    //   return clone;
    // }), null, 2));
    // self.playlist_sidebar.append(self.gen_sidebar_entry({playlist: playlist}));
    self.playlist_tree.treeview(self.gen_tree_data());
  };

  // self.draw_sidebar = function(playlists) {
  //   self.playlist_sidebar.empty();
  //   _.forEach(playlists, self.add_to_sidebar);
  // };

  self.add_to_table = function(track) {
    // console.log("adding ", track.title)
    self.playlist_table.children("tbody").append(self.gen_file_entry({track: track}));
  };

  self.draw_table = function() {
    self.playlist_table.children("tbody").empty();
    if (typeof self.model.selected_playlist !== 'undefined') {
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

  // self.draw_sidebar(model.playlists);
  self.draw_table(model.selected_playlist);

  // self.playlist_sidebar.on('click', 'a', function (event) {
  //   var search_name = $(this).data('name');

  //   self.playlist_sidebar.children('.active').removeClass('active');
  //   $(this).parent().addClass('active');

  //   var selected_playlist = _.find(self.model.playlists, function(playlist) {
  //     return (playlist.name == search_name);
  //   });

  //   event.preventDefault();
  //   self.model.selected_playlist = selected_playlist;
  //   self.draw_table(selected_playlist);
  // });

  self.nodeSelectedHandler = function(event, node) {
    // console.log("node selected:", node.text);
    var search_name = node.text;
    var selected_playlist = _.find(self.model.playlists, function(playlist) {
      return (playlist.name == search_name);
    });
    self.model.selected_playlist = selected_playlist;
    self.draw_table();
  };

  self.nodeUnselectedHandler = function(event, node) {
    // console.log("node unselected:", node.text);
    self.model.selected_playlist = undefined;
    self.draw_table();
  };
}

// PlaylistView.prototype.add_to_sidebar = function (playlist) {
//   this.playlist_sidebar.append(gen_playlist_view({playlist: playlist}));
// };

// PlaylistView.prototype.draw_sidebar = function(playlists) {
//   this.playlist_sidebar.empty();
//   _.forEach(playlists, this.add_to_sidebar);
// };

// PlaylistView.prototype.add_to_table = function(track) {
//   this.playlist_table.children('tbody').append(gen_file_entry({track: track}));
// };

// PlaylistView.prototype.draw_table = function(selected_playlist) {
//   this.playlist_table.children('tbody').empty();
//   _.forEach(selected_playlist.tracks, this.add_to_table);
// };

util.inherits(PlaylistView, events.EventEmitter);

exports.PlaylistView = PlaylistView; 
