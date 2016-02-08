var assert = require('assert');

var Playlist = require('../app/lib/playlist').Playlist;

describe('Playlist', function() {
  describe('#add_from_itunes(i_playlist)', function () {
    it('should add an itunes playlist object to the playlist tree rooted at "this"', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});