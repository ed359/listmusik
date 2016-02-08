var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var nwb = require('nw-builder');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;

var paths = {
  dist: 'dist',
  nwcache: './dist/nwcache',
  src: ['app/**/*'],
  src_js: ['app/main.js', 'app/lib/*.js']
};

// INSTALLATION

gulp.task('postinstall', function(cb) {

  gutil.log('Installing bower dependencies');
  spawnSync('bower', ['install'],
    { cwd: '.', stdio: 'inherit' });

  gutil.log('Installing node dependencies in app');
  spawnSync('npm', ['install'],
    { cwd: 'app', stdio: 'inherit' });
  var nwpackage = require('./node_modules/nw/package.json');
  var nwtarget = nwpackage.version;
  gutil.log('Compiling node-expat for nw version', nwtarget);

  spawnSync('nw-gyp', ['configure', '--target=' + nwtarget],
    { cwd: 'app/node_modules/node-expat', stdio: 'inherit' });
  spawnSync('nw-gyp', ['build'],
    { cwd: 'app/node_modules/node-expat', stdio: 'inherit' });
  return cb();
});

// DEVELOPMENT TASKS

gulp.task('default', ['run']);

gulp.task('lint', function() {
  return gulp.src(paths.src_js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('style', function() {
  return gulp.src(paths.src_js)
    .pipe(jscs({fix: true}))
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'));
});

gulp.task('run', ['lint'], function(cb) {
  return spawn('./node_modules/nw/bin/nw', ['./app', '--debug'], { stdio: 'inherit' })
    .on('close', cb);
});
gulp.task('start', ['run']);

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