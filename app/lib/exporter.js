var events = require('events');
var fs = require('fs-extra');
var jade = require('jade');
var mkdirp = require('mkdirp');
var path = require('path');
var util = require('util');
var _ = require('lodash');

// Our type
function Exporter (model, dom) {
  var self = this;

  self.model = model;
  self.root_folder = model.root_folder;

  self.addressbar = dom.addressbar;
  self.dialog = dom.dialog;
  self.ext_dialog = dom.ext_dialog;
  self.itunes_btn = dom.itunes_btn;
  self.traktor_btn = dom.traktor_btn;
  self.copy_traktor_btn = dom.copy_traktor_btn;
  self.verify_toggle = dom.verify_toggle;

  var gen_addressbar = jade.compile([
    '- each item, i in sequence',
    '  - if (i != sequence.length - 1)',
    '    li(data-path="#{item.path}")',
    '      a(href="#") #{item.name}',

    // '      | #{item.name}',
    '  - else',
    '    li.active(data-path="#{item.path}")',
    '      a(href="#") #{item.name}'

    // '      | #{item.name}'
  ].join('\n'));

  var gen_addressbar_entry = jade.compile([
    'li(data-path="#{item.path}")',
    '  a(href="#") #{item.name}'

    // 'li(data-path="#{item.path}")',
    // '  | #{item.name}'
  ].join('\n'));

  var load_root_folder = function (root_path) {
    self.traktor_btn.prop('disabled', false);
    addressbar_set_root(root_path);
    self.root_folder = root_path;
  };

  var addressbar_set_root = function (root_path) {
    var current_path = path.normalize(root_path);

    // Split path into separate elements
    var sequence = current_path.split(path.sep);
    var result = [];

    for (var i = 0; i < sequence.length; i++) {
      result.push({
        name: sequence[ i ],
        path: sequence.slice(0, i + 1).join(path.sep)
      });
    }

    // Add root for *nix
    if (sequence[ 0 ] === '' && process.platform !== 'win32') {
      result[ 0 ] = {
        name: 'Root',
        path: '/'
      };
    }
    self.addressbar.html(gen_addressbar({ sequence: result }));
  };

  var copy_traktor_playlists = function(target_path) {

    fs.copy(path.join(self.root_folder, 'TraktorPlaylists'),
      path.join(target_path, 'TraktorPlaylists'),
      function (err) {
        if (err) return console.error(err);
        console.log('copy success');
      });

  };

  self.addressbar_enter = function (mine) {

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

  self.addressbar.delegate('a', 'click', function () {
    self.addressbar.children('.active').removeClass('active');
    $(this).parent().addClass('active');
    var selected_path = $(this).parent().attr('data-path');
    load_root_folder(selected_path, false);
  });

  self.dialog.unbind('change');
  self.dialog.change(function (evt) {
    var selected_path = $(this).val();
    if (selected_path) {
      load_root_folder(selected_path);
    }
  });

  self.ext_dialog.unbind('change');
  self.ext_dialog.change(function (evt) {
    var selected_path = $(this).val();
    if (selected_path) {
      copy_traktor_playlists(selected_path);
    }
  });

  self.itunes_btn.click(function(e) {
    console.log('Exporting iTunes Playlists');
    console.log('Export folder:', self.root_folder);
    export_playlists(self.root_folder, '', self.model.itunes_playlists_root);
  });

  self.traktor_btn.click(function(e) {
    console.log('Exporting Traktor Playlists');
    console.log('Export folder:', self.root_folder);
    export_playlists(self.root_folder, '', self.model.traktor_playlists_root);
  });

  self.copy_traktor_btn.click(function(e) {
    console.log('Copying Traktor Playlist to External Device');
    console.log('Export folder:', self.root_folder);

    self.ext_dialog.click();

    export_playlists(self.root_folder, '', self.model.traktor_playlists_root);

  });

  function export_playlists (playlists_folder, playlist_path, playlist) {
    var track_cb = function(track_path) {
      var target_path = path.join(self.root_folder, playlist_path);
      var final_path = path.relative(target_path, track_path);
      return path.normalize(final_path);
    };
    var m3u = playlist.toM3u(track_cb);
    if (m3u.length > 0) {

      //console.log('Playlist path:', path.join(playlist_path, m3u.filename));
      //console.log('Contents:');
      //console.log(m3u.data);
      var filepath = path.join(playlists_folder, playlist_path, m3u.filename);
      mkdirp.sync(path.join(playlists_folder, playlist_path));

      fs.writeFileSync(filepath, m3u.data);
    }
    playlist.playlists.forEach(function(sub_playlist) {
      export_playlists(playlists_folder, path.join(playlist_path, playlist.name), sub_playlist);
    });
  }

  load_root_folder(self.root_folder);
}

exports.Exporter = Exporter;
