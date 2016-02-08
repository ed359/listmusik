var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var nwb = require('nw-builder');

var paths = {
  dist: 'dist',
  nwcache: './dist/nwcache',
  src: ['app/**/*'],
  src_js: ['app/main.js', 'app/lib/*.js']
};

// DEVELOPMENT TASKS

gulp.task('default', ['lint']);

gulp.task('lint', function() {
  return gulp.src(paths.src_js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

// DEPLOY TASKS

gulp.task('clean', function(cb) {
  return del(paths.dist + '/listmusik', cb);
});

gulp.task('deploy', ['lint', 'clean'], function() {
  var nw_pkg = require('nw/package.json');

  var nw = new nwb({
    buildDir: paths.dist,
    cacheDir: paths.nwcache,
    files: paths.src,
    // macCredits: 'path/to/credits.html'
    // macIcns: 'img/icon.icns',
    platforms: ['osx64'],
    version: nw_pkg.version,
  });

  nw.on('log', gutil.log);

  return nw.build().catch(gutil.log);
});