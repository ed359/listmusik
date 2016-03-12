var fs = require('fs');
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
    self.xml_path = '~/Documents/Native Instruments/Traktor 2.6.2/collection.nml'.replace('~', process.env.HOME);

  self.end_cb = end_cb;
  self.parser_running = false;
  self.parser = self.init_parser(playlists_root);
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
        var track = new Track(attrs.KEY.replace(/\/:/g, '/'));
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
