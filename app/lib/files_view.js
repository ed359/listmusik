var events = require('events');
var jade = require('jade');
var path = require('path');
var util = require('util');
var _ = require('lodash');

// Our type
function FilesView (model, dom, load_subfolder_cb, load_root_folder_cb) {
  var self = this;

  events.EventEmitter.call(self);
  self.model = model;

  self.addressbar = dom.addressbar;
  self.dialog = dom.dialog;
  self.sidebar = dom.sidebar;
  self.table = dom.table;

  var gen_sidebar = jade.compile([

    // 'li.dropdown-header Subfolders',
    '- each dir in subfolders',
    '  li',
    '    a(href="#", data-subfolder=\'{\"path\": \"#{dir.path}\", \"name\": \"#{dir.name}\"}\')',

    // '    a(href="#", data-subfolder="#{dir.path}")',
    '      span.glyphicon.glyphicon-folder-close.space-after',
    '      | #{dir.name}'
    ].join('\n'));

  var gen_file_entry = jade.compile([
      'tr',
      '  td #{track.filename}',
      '  td #{track.title}',
      '  td #{track.artist}',
      '  td #{track.playlists}'
  ].join('\n'));

  var gen_addressbar = jade.compile([
    '- each item, i in sequence',
    '  - if (i != sequence.length - 1)',
    '    li(data-path="#{item.path}")',
    '      a(href="#") #{item.name}',
    '  - else',
    '    li.active(data-path="#{item.path}")',
    '      a(href="#") #{item.name}'
  ].join('\n'));

  var gen_addressbar_entry = jade.compile([
    'li(data-path="#{item.path}")',
    '  a(href="#") #{item.name}'
  ].join('\n'));

  var load_root_folder = function(root_path, set_addressbar) {
    load_root_folder_cb(root_path);
    self.draw_sidebar();
    if (set_addressbar)
      addressbar_set_root(root_path);
  };

  self.draw_sidebar = function() {
    self.sidebar.html(gen_sidebar({ subfolders: self.model.subfolders }));
  };

  var addressbar_set_root = function(root_path) {
    var current_path = path.normalize(root_path);

    // Split path into separate elements
    var sequence = current_path.split(path.sep);
    var result = [];

    for (var i = 0; i < sequence.length; i++) {
      result.push({
        name: sequence[i],
        path: sequence.slice(0, i + 1).join(path.sep)
      });
    }

    // Add root for *nix
    if (sequence[0] === '' && process.platform !== 'win32') {
      result[0] = {
        name: 'Root',
        path: '/'
      };
    }
    self.addressbar.html(gen_addressbar({ sequence: result }));
  };

  self.addressbar_enter = function(mine) {

    // Where is current
    var how_many = self.addressbar.children().length;
    var where = self.addressbar.children('.active').index();
    if (where == how_many - 1) {

      // Add '/' on tail
      self.addressbar.children().eq(-1).append('<span class="divider">/</span>');
    } else {
      self.addressbar.children('li:gt(' + where + ')').remove();
    }

    // Add new folder
    self.addressbar.append(gen_addressbar_entry({ item: mine }));
    self.addressbar.find('a:last').trigger('click');
  };

  self.clear_table = function() {
    self.table.children('tbody').empty();
  };

  self.add_to_table = function(track) {

    // Console.log("adding ", track.title)
    self.table.children('tbody').append(gen_file_entry({ track: track }));
  };

  self.draw_table = function() {
    self.table.children('tbody').empty();
    if (self.model.selected_subfolder !== null) {
      console.log('Drawing table, length', self.model.subfolder_tracks.length);
      _.forEach(self.model.subfolder_tracks, self.add_to_table);

      // Self.table.DataTable({
      //   paging: false,
      //   searching: true,
      // });
    }
  };

  self.sidebar.on('click', 'a', function(event) {
    self.sidebar.children('.active').removeClass('active');
    self.sidebar.find('span').removeClass('glyphicon-folder-open')
      .addClass('glyphicon-folder-close');
    $(this).parent().addClass('active');
    $(this).find('span').removeClass('glyphicon-folder-close')
      .addClass('glyphicon-folder-open');

    event.preventDefault();

    var selected_path = $(this).data('subfolder').path;
    self.clear_table();
    load_subfolder_cb(selected_path);

  });

  self.addressbar.delegate('a', 'click', function() {
    self.addressbar.children('.active').removeClass('active');
    $(this).parent().addClass('active');
    var selected_path = $(this).parent().attr('data-path');
    load_root_folder(selected_path, false);
  });

  self.dialog.unbind('change');
  self.dialog.change(function(evt) {
    var selected_path = $(this).val();
    if (selected_path) {
      load_root_folder(selected_path, true);
    }
  });

  // Load the root folder
  load_root_folder(self.model.root_folder, true);
}

util.inherits(FilesView, events.EventEmitter);

exports.FilesView = FilesView;
