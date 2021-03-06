var debug = require('gulp-debug');
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var nwb = require('nw-builder');
var path = require('path');
var spawn = require('child_process').spawn;
var spawnSync = require('child_process').spawnSync;

var paths = {
  dist: 'dist',
  gulp: './node_modules/gulp/bin/gulp.js',
  nw: {
    bin: './node_modules/nw/bin/nw',
    cache: './dist/nwcache',
    package: './node_modules/nw/package.json'
  },
  src: ['app/**/*'],
  src_js: ['app/main.js', 'app/lib/*.js'],
  test: 'test/*.js'
};

// INSTALLATION

gulp.task('postinstall', function(cb) {

  gutil.log('Installing bower dependencies');
  spawnSync('bower', ['install'],
    { cwd: '.', stdio: 'inherit' });

  gutil.log('Setting environment variables for nw-gyp');
  var nwpackage = require(paths.nw.package);
  var nwtarget = nwpackage.version;

  spawnSync('export', ['npm_config_target=' + nwtarget],
    { cwd: 'app', stdio: 'inherit' });
  spawnSync('export', ['npm_config_arch=x64'], // TODO: fix hardcoded x64
    { cwd: 'app', stdio: 'inherit' });
  spawnSync('export', ['npm_config_target_arch=x64'],
    { cwd: 'app', stdio: 'inherit' });
  spawnSync('export', ['npm_config_runtime=node-webkit'],
    { cwd: 'app', stdio: 'inherit' });
  spawnSync('export', ['npm_config_build_from_source=true'],
    { cwd: 'app', stdio: 'inherit' });
  spawnSync('export', ['export npm_config_node_gyp=$(which nw-gyp)'],
    { cwd: 'app', stdio: 'inherit' });

  gutil.log('Installing node dependencies in app');
  spawnSync('npm', ['install'],
    { cwd: 'app', stdio: 'inherit' });

  return cb();
});

// DEVELOPMENT TASKS

gulp.task('default', ['run']);

gulp.task('test', ['test-actual'], function (cb) {
  // TODO: work out how to test external C module code in nwjs
  // return spawn(paths.nw.bin, [paths.gulp, '--gulpfile', 'gulpfile.js', 'test-actual'],
  //   { cwd: '.', stdio: 'inherit' })
  //   .on('close', cb);
});

gulp.task('test-actual', ['lint', 'style'], function () {
  return gulp.src(paths.test, {read: false})
    // gulp-mocha needs filepaths so you can't have any plugins before it
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('lint', function() {
  return gulp.src(paths.src_js, { base: 'app' })
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('run', ['lint', 'style'], function(cb) {
  return spawn(paths.nw.bin, ['./app', '--debug'], { stdio: 'inherit' })
    .on('close', cb);
});
gulp.task('start', ['run']);

gulp.task('style', ['lint'], function() {
  return gulp.src(paths.src_js, { base: 'app' })
    .pipe(jscs({fix: true}))
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'))
    .pipe(gulp.dest('app'));
});

// DEPLOY TASKS

gulp.task('clean', function(cb) {
  return del(paths.dist + '/listmusik', cb);
});

gulp.task('deploy', ['lint', 'clean'], function() {
  var nw_pkg = require('nw/package.json');

  var nw = new nwb({
    buildDir: paths.dist,
    cacheDir: paths.nw.cache,
    files: paths.src,
    // macCredits: 'path/to/credits.html'
    // macIcns: 'img/icon.icns',
    platforms: ['osx64'],
    version: nw_pkg.version,
  });

  nw.on('log', gutil.log);

  return nw.build().catch(gutil.log);
});
