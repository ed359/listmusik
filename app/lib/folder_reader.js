var ffm = require("ffmetadata");
var file_url = require('file-url');
var fs = require ('fs');
var path = require('path');
var _ = require('lodash');

var Track = require('./track').Track;

function FolderReader() {  
  var self = this;
}

function is_music_file(file) {
  var music_extensions = [ '.mp3' ];
  if (_.includes(music_extensions, path.extname(file).toLowerCase()) && !/^\./.test(file)) 
    return true;
  else 
    return false;
}

function unescape_ffm_string(str) {
  if (typeof str === 'undefined')
    str = '';
  // hack to find escaped html with the trailing ';' itself escaped by a '\'
  return _.unescape(str.replace('\\;',';'));
}

FolderReader.prototype.read_subfolder = function(subfolder_path, track_cb) {
  
  var self = this;

  // self.files_view.clear_table();
  // self.model.subfolder_tracks = [];

  fs.readdir(subfolder_path, function(fs_error, files) {
    if (fs_error) {
      console.log(fs_error);
      window.alert(fs_error);
      return;
    }
    files = _.filter(files, is_music_file);

    _.each(files, function(file) {
      var full_path = path.join(subfolder_path, file);
      var url = file_url(full_path);
      var track;
      ffm.read(full_path, function(ffm_error, track_data) {
        if (ffm_error) {
          console.error("Error reading metadata in " + file, ffm_error);
          track = new Track(url, '', '');
        } else {
          track = new Track(url, unescape_ffm_string(track_data.title), unescape_ffm_string(track_data.artist));
        }

        track_cb(track);
      });
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
        subfolder_cb({path: full_path, name: file});
      }
    });
  });
};

exports.FolderReader = FolderReader; 
