var fs = require('fs');
var path = require('path');
var semver = require('semver');
var _ = require('lodash');

var Playlist = require('./playlist').Playlist;
var Track = require('./track').Track;

var expat = require('node-expat');

function NmlParser (playlists_root, end_cb, options) {
  var self = this;
  if (options && typeof options.verbose !== 'undefined')
    self.verbose = options.verbose;
  else
    self.verbose = false;
  if (options && options.xml_path)
    self.xml_path = options.xml_path;
  else
    self.xml_path = find_collection();

  self.end_cb = end_cb;
  self.parser_running = false;
  self.playlists_root = playlists_root;

  //self.parser = self.init_parser(playlists_root);
}

function find_collection () {
  var base_path = '~/Documents/Native Instruments'.replace('~', process.env.HOME);
  var subfolders = fs.readdirSync(base_path);
  var latest_version = _.reduce(subfolders, function(result, folder) {
    var version = folder.match(/\d+\.\d+\.\d+/);
    if (version !== null && semver.gt(version[ 0 ], result))
      return version[ 0 ];
    else
      return result;
  }, '0.0.0');
  if (latest_version === '0.0.0') {
    console.log('Traktor collection not found');
    return null;
  } else {
    return path.join(base_path, 'Traktor ' + latest_version, 'collection.nml');
  }
}

NmlParser.prototype.set_xml_path = function(path) {
  var self = this;
  self.xml_path = path;
};

NmlParser.prototype.parse = function () {
 var self = this;
  if (self.parser_running) {
    if (self.verbose)
      console.error('NmlParser parser already running');
    self.parser.stop();
  }
  if (self.stream) {
    if (self.verbose)
      console.log('NmlParser stream exists');
    self.stream.unpipe();
    self.stream.destroy();
  }
  if (self.verbose)
    console.log('NmlParser parsing', self.xml_path);

  self.stream = fs.createReadStream(self.xml_path);

  if (self.verbose)
    console.log('NmlParser stream', self.stream.path);

  self.parser_running = true;
  self.parser = self.init_parser(self.playlists_root);
  self.stream.pipe(self.parser);
};

NmlParser.prototype.init_parser = function (playlists_root) {
  var self = this;
  var parser = new expat.Parser('utf-8'),
      current = playlists_root,
      folder_id = 0,
      ignored_playlists = [
        '_LOOPS',
        '_RECORDINGS'
      ],
      element,
      key = 'library',
      stack = [],
      value,
      depth = 0,
      parse = identity,
      parsers = {
        'integer': parseInt,
        'date': function (str) {
          return new Date(str);
        }
      };

  parser.on('startElement', function (name, attrs) {

    // console.warn("+", name);
    var parent = current;
    element = name;
    switch (name) {
      case 'NML':
        current.version = attrs.VERSION;
        break;
      case 'PLAYLISTS':
        console.log('Found PLAYLISTS');
        break;
      case 'NODE':
        if (attrs.TYPE === 'FOLDER' && attrs.NAME === '$ROOT') {
          console.log('Found $ROOT');
          folder_id++;
        } else if (attrs.TYPE === 'FOLDER') {
          depth = stack.push(current);
          var folder = new Playlist(attrs.NAME, folder_id);
          current.add_child(folder);
          current = folder;
          folder_id++;
        } else if (attrs.TYPE === 'PLAYLIST') {
          depth = stack.push(current);
          var playlist = new Playlist(attrs.NAME, null);
          if (!_.includes(ignored_playlists, attrs.NAME))
            current.add_child(playlist);
          current = playlist;
        }
        break;
      case 'PLAYLIST':
        current.id = attrs.UUID;
        break;
      case 'PRIMARYKEY':

        //var track = new Track(attrs.KEY.replace(/^.+?(?=\/)/,''));
        var track_path = attrs.KEY.replace(/\/:/g, '/');

        // Stupid hack for Rosy
        track_path = track_path.replace('//Music', '');

        // Traktor stores track paths in a playlist relative to the /Volumes
        // folder on OSX. This means file paths in the main root tree appear
        // relative to the symlink to the root in /Volumes often called
        // "Macintosh HD", so we use fs.realpath to resolve this.

        // if path.join('/Volumes', track_path);
        // if (track_path.match(/^(Macintosh HD)/))
        //   track_path = track_path.replace('Macintosh HD', '');
        // else
        //   track_path = path.join('/Volumes', track_path);
        track_path = fs.realpathSync(path.join('/Volumes', track_path));

        var track = new Track(track_path);
        current.add_track(track);
        break;
    }
  });

  parser.on('text', function (text) {
    if (element === 'key') {
      key = text;
    }
    var val = parse(text);
    if (typeof val === 'string') {
      value += val;
    } else {
      value = val;
    }
  });

  parser.on('endElement', function (name) {

    // console.warn("-", name);
    element = null;
    switch (name) {
      case 'NODE':
        current = stack.pop();
        depth = stack.length;
        break;
      case 'PLAYLISTS':
        self.end_cb(playlists_root);
        break;
    }
  });

  parser.on('end', function () {

    if (self.verbose)
      console.log('NmlParser completed parsing');
    self.stream.unpipe();
    self.parser_running = false;
  });

  return parser;
};

// function repeat(str, len) {
//   var out = [];
//   for (var i = 0; i < len; i++) out.push(str);
//   return out.join("");
// }

function identity (d) {
  return d;
}

exports.NmlParser = NmlParser;
