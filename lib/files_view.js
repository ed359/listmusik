var events = require('events');
var jade = require('jade');
var util = require('util');
var _ = require('lodash');

// Our type
function FilesView(model, files_sidebar, files_addressbar, files_table) {  
  var self = this;

  events.EventEmitter.call(self);
  self.model = model;

  self.files_sidebar = files_sidebar;
  self.files_addressbar = files_addressbar;
  self.files_table = files_table;

  self.gen_sidebar = jade.compile([
    // 'li.nav-header Subfolders',
    '- each dir in subfolders',
    '  li',
    '    a(href="#", data-subfolder=\'{\"path\": \"#{dir.path}\", \"name\": \"#{dir.name}\"}\')',
    // '    a(href="#", data-subfolder="#{dir.path}")',
    '      span.glyphicon.glyphicon-folder-close',
    '      | #{dir.name}'
    ].join('\n'));

  self.gen_file_entry = jade.compile([
      'tr',
      '  td #{track.filename}',
      '  td #{track.title}',
      '  td #{track.artist}',
      '  td #{track.playlists}',
  ].join('\n'));

  self.draw_sidebar = function() {
    self.files_sidebar.html(self.gen_sidebar({subfolders: self.model.subfolders}));
  };

  self.clear_table = function() {
    self.files_table.children("tbody").empty();
  };

  self.add_to_table = function(track) {
    // console.log("adding ", track.title)
    self.files_table.children("tbody").append(self.gen_file_entry({track: track}));
  };

  self.draw_table = function() {
    self.files_table.children("tbody").empty();
    if (typeof self.model.subfolder !== 'undefined') {
      console.log("Drawing table, length", self.model.subfolder_tracks.length)
      _.forEach(self.model.subfolder_tracks, self.add_to_table);
      // self.files_table.DataTable({
      //   paging: false,
      //   searching: true,
      // });
    }
  };

  self.files_sidebar.on('click', 'a', function (event) {
    self.model.subfolder = $(this).data('subfolder');
    event.preventDefault();
    self.emit('loadSubfolder');
  });

}

util.inherits(FilesView, events.EventEmitter);

exports.FilesView = FilesView; 
