var events = require('events');
var jade = require('jade');
var path = require('path');
var util = require('util');
var _ = require('lodash');

// Our type
function FilesView(model, files_sidebar, files_addressbar, files_dialog, files_table) {  
  var self = this;

  events.EventEmitter.call(self);
  self.model = model;

  self.files_sidebar = files_sidebar;
  self.files_addressbar = files_addressbar;
  self.files_dialog = files_dialog;
  self.files_table = files_table;

  self.gen_sidebar = jade.compile([
    // 'li.dropdown-header Subfolders',
    '- each dir in subfolders',
    '  li',
    '    a(href="#", data-subfolder=\'{\"path\": \"#{dir.path}\", \"name\": \"#{dir.name}\"}\')',
    // '    a(href="#", data-subfolder="#{dir.path}")',
    '      span.glyphicon.glyphicon-folder-close.space-after',
    '      | #{dir.name}'
    ].join('\n'));

  self.gen_file_entry = jade.compile([
      'tr',
      '  td #{track.filename}',
      '  td #{track.title}',
      '  td #{track.artist}',
      '  td #{track.playlists}',
  ].join('\n'));

  self.gen_addressbar = jade.compile([
    '- each item, i in sequence',
    '  - if (i != sequence.length - 1)',
    '    li(data-path="#{item.path}")',
    '      a(href="#") #{item.name}',
    '  - else',
    '    li.active(data-path="#{item.path}")',
    '      a(href="#") #{item.name}',
  ].join('\n'));

  self.gen_addressbar_entry = jade.compile([
    'li(data-path="#{item.path}")',
    '  a(href="#") #{item.name}',
  ].join('\n'));

  self.draw_sidebar = function() {
    self.files_sidebar.html(self.gen_sidebar({subfolders: self.model.subfolders}));
  };

  self.addressbar_set_root = function() {
    var dir_path = self.model.root_folder;
    var current_path = path.normalize(dir_path);

    // Split path into separate elements
    var sequence = current_path.split(path.sep);
    var result = [];

    var i = 0;
    for (; i < sequence.length; ++i) {
      result.push({
        name: sequence[i],
        path: sequence.slice(0, 1 + i).join(path.sep),
      });
    }

    // Add root for *nix
    if (sequence[0] === '' && process.platform != 'win32') {
      result[0] = {
        name: 'Root',
        path: '/',
      };
    }
    self.files_addressbar.html(self.gen_addressbar({ sequence: result }));
  };

  self.addressbar_enter = function(mine) {
    // Where is current
    var how_many = self.files_addressbar.children().length;
    var where = self.files_addressbar.children('.active').index();
    if (where == how_many - 1) {
      // Add '/' on tail
      self.files_addressbar.children().eq(-1).append('<span class="divider">/</span>');
    } else {
      self.files_addressbar.children('li:gt(' + where + ')').remove();
    }

    // Add new folder
    self.files_addressbar.append(self.gen_addressbar_entry({ item: mine }));
    self.files_addressbar.find('a:last').trigger('click');
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
    if (self.model.selected_subfolder !== null) {
      console.log("Drawing table, length", self.model.subfolder_tracks.length);
      _.forEach(self.model.subfolder_tracks, self.add_to_table);
      // self.files_table.DataTable({
      //   paging: false,
      //   searching: true,
      // });
    }
  };

  self.files_sidebar.on('click', 'a', function (event) {
    self.files_sidebar.children('.active').removeClass('active');
    self.files_sidebar.find('span').removeClass('glyphicon-folder-open').addClass('glyphicon-folder-close');
    $(this).parent().addClass('active');
    $(this).find('span').removeClass('glyphicon-folder-close').addClass('glyphicon-folder-open');

    self.model.selected_subfolder = $(this).data('subfolder');
    event.preventDefault();
    self.emit('load-subfolder');
  });

  self.addressbar_set_root();

  self.files_addressbar.delegate('a', 'click', function () {
    self.files_addressbar.children('.active').removeClass('active');
    $(this).parent().addClass('active');
    self.emit('addressbar-navigate', $(this).parent().attr('data-path'));
  });

  self.files_dialog.unbind('change');
  self.files_dialog.change(function(evt) {
    var selected_path = $(this).val();
    if (selected_path)
      self.emit('dialog-navigate', selected_path);
  });
}

util.inherits(FilesView, events.EventEmitter);

exports.FilesView = FilesView; 
