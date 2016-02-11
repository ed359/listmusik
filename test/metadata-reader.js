var assert = require('assert');

var MetadataReaderFFM = require('../app/lib/metadata-reader-ffm').MetadataReader;
var MetadataReaderMM = require('../app/lib/metadata-reader-mm').MetadataReader;

describe('MetadataReaderFFM', function () {
  describe('#read(file_path, callback)', function () {
    it('should read the metadata from the mp3', function (done) {

      var mr = new MetadataReaderFFM();
      var file_path = './test/test.mp3'; // mocha runs from the listmusik directory
      var callback = function(track) {
        assert.equal('TestTitle', track.title);
        assert.equal('TestArtist', track.artist);
        done();
      };

      mr.read(file_path, callback);
    });
  });
});

describe('MetadataReaderMM', function () {
  describe('#read(file_path, callback)', function () {
    it('should read the metadata from the mp3', function (done) {

      var mr = new MetadataReaderMM();
      var file_path = './test/test.mp3'; // mocha runs from the listmusik directory
      var callback = function(track) {
        assert.equal('TestTitle', track.title);
        assert.equal('TestArtist', track.artist);
        done();
      };

      mr.read(file_path, callback);
    });
  });
});