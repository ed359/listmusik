var file_url = require('file-url');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var Track = require('./track').Track;
var MetadataReader = require('./metadata-reader-mm').MetadataReader;

function FolderReader () {
  var self = this;
  self.mr = new MetadataReader();
}

function is_music_file (file) {
  var music_extensions = ['.mp3'];
  if (_.includes(music_extensions, path.extname(file).toLowerCase()) && !/^\./.test(file))
    return true;
  else
    return false;
}

FolderReader.prototype.read_subfolder = function(subfolder_path, track_cb) {

  var self = this;

  // Self.files_view.clear_table();
  // self.model.subfolder_tracks = [];

  fs.readdir(subfolder_path, function(error, files) {
    if (error) {
      console.log(error);
      window.alert(error);
      return;
    }
    files = _.filter(files, is_music_file);

    files.forEach(function(file) {
      var file_path = path.join(subfolder_path, file);
      self.mr.read(file_path, track_cb);
    });
  });
};

FolderReader.prototype.read_root_folder = function(root_path, subfolder_cb) {
  var self = this;

  fs.readdir(root_path, function(error, files) {
    if (error) {
      console.log(error);
      window.alert(error);
      return;
    }

    _.each(files, function(file) {
      var full_path = path.join(root_path, file);
      var filestat = fs.statSync(full_path);
      if (filestat.isDirectory() && !/^\./.test(file)) {
        subfolder_cb({ path: full_path, name: file });
      }
    });
  });
};

exports.FolderReader = FolderReader;
