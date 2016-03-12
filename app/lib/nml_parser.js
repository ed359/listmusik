var fs = require('fs');
var _ = require('lodash');

var Playlist = require('./playlist').Playlist;
var Track = require('./track').Track;

// var parse_xml = require('xml2js').parseString;

// function parse_nml (path) {

//   var collection_string = fs.readFileSync(path, 'utf8');
//   var matched = {};
//   parse_xml(collection_string, 
//     function (err, collection_object) {
//       var collection = collection_object['NML']['COLLECTION'][0]['ENTRY'];
//       var playlists = collection_object['NML']['PLAYLISTS'][0]['NODE'][0]['SUBNODES']; //[0]['NODE'][0]['PLAYLIST'][0]['ENTRY'];
//       var get_collection_track_id = function (track) {
//         var track = track['LOCATION'][0]['$'];
//         var key = track['DIR'] + track['FILE'];
//         return key;
//       };
//       var get_playlist_track_id = function (track) {
//         var track = track['PRIMARYKEY'];
//         var key = track[0]['$']['KEY'].replace(/^.+?(?=\/)/, '');
//         return key;
//       };
//       var indexed = _.indexBy(collection, get_collection_track_id);
//       matched = _.map(playlists, function (track) {
//         var key = get_playlist_track_id(track);
//         return this[key];
//       }, indexed);
//     });


//   return matched;
// }

// exports.parse_nml = parse_nml;

var expat = require("node-expat");

function init_parser(playlists_root) {

  var parser = new expat.Parser("utf-8"),
      current = playlists_root,
      folder_id = 0,
      ignored_playlists = [
        '_LOOPS',
        '_RECORDINGS'
      ],
      element,
      key = "library",
      stack = [],
      value,
      depth = 0,
      parse = identity,
      parsers = {
        "integer": parseInt,
        "date": function(str) {
          return new Date(str);
        }
      };

  parser.on("startElement", function(name, attrs) {
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
        }
        else if (attrs.TYPE === 'FOLDER') {
          depth = stack.push(current);
          var folder = new Playlist(attrs.NAME, folder_id);
          current.add_child(folder);
          current = folder;
          folder_id++;
        }
        else if (attrs.TYPE === 'PLAYLIST') {
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
        var track = new Track(attrs.KEY.replace(/\/:/g,'/'));
        current.add_track(track);
        break;
    }
  });

  parser.on("text", function(text) {
    if (element === "key") {
      key = text;
    }
    var val = parse(text);
    if (typeof val === "string") {
      value += val;
    } else {
      value = val;
    }
  });

  parser.on("endElement", function(name) {
    // console.warn("-", name);
    element = null;
    switch (name) {
      case "NODE":
        current = stack.pop();
        depth = stack.length;
        break;
      case 'PLAYLISTS':
        parser.emit("playlists_root", playlists_root);
        break;
    }
  });

  return parser;
}

function repeat(str, len) {
  var out = [];
  for (var i = 0; i < len; i++) out.push(str);
  return out.join("");
}

function identity(d) {
  return d;
}

exports.init_parser = init_parser;
