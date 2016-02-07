var addsrc = require('gulp-add-src');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var del = require('del');
var path = require('path');
var nwb = require('nw-builder');
var gutil = require('gulp-util');
var fs = require('fs');
var mbf = require('main-bower-files');
var exec = require('child_process').exec;
var spawn = require("gulp-spawn");
var jshint = require('gulp-jshint');

var paths = {
  build: './build',
  dist: './dist',
  nwcache: './dist/nwcache',
  src: ['index.html', 'package.json', 'style.css'],
  js_src: ['main.js', 'lib/*.js'],
  package_data: ['package.json'],
};

gulp.task('default');

// DEVELOPMENT TASKS

gulp.task('bower-install', function (cb) {
  spawn({
    cmd: 'bower',
    args: ['install'],
  });
});

gulp.task('clean', function(cb) {
  del([paths.build, paths.dist], cb);
});

gulp.task('npm-install', function (cb) {
  spawn({
    cmd: 'npm',
    args: ['install'],
  });
});

gulp.task('install', ['npm-install', 'bower-install', 'nw-gyp']);

gulp.task('lint', function() {
  return gulp.src(paths.js_src)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('nw-gyp', ['npm-install'], function (cb) {
  exec('nw-gyp configure --target=`npm info nw version` && nw-gyp build', 
    {cwd: './node_modules/node-expat'},
    function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// BUILD TASKS

gulp.task('build', ['build-bower', 'build-compress', 'build-npm', 'build-src']);

// copy bower dependencies to build
gulp.task('build-bower', function() {
    return gulp.src(mbf(), { base: './bower_components' })
        .pipe(gulp.dest(path.join(paths.build,'bower_components')));
});

// compress js and copy to build
gulp.task('build-compress', function() {
  return gulp.src(paths.js_src, {base: './'})
    .pipe(uglify())
    .pipe(gulp.dest(paths.build));
});

// copy node dependencies to build
gulp.task('build-npm', function() {
  // return spawn({
  //     cmd: 'npm',
  //     args: ['ls', '--prod', '--parseable'],
  //   }).pipe(source)
  //   .pipe(gulp.dest(paths.build));
  // return gulp.src('./node_modules/**/*', {base: './'})
  //   .pipe(gulp.dest(paths.build));
});

gulp.task('build-run', ['build'], function (cb) {
  exec(path.join(paths.build, 'node_modules/nw/bin/nw') + ' ' + paths.build + ' --debug', 
    function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// copy non-js sources files to build
gulp.task('build-src', function() {
  return gulp.src(paths.src, {base: './'})
    .pipe(gulp.dest(paths.build));
});

// DEPLOY TASKS

gulp.task('deploy', ['build'], function() {
  var nw_pkg = require('nw/package.json');

  var nw = new nwb({
    buildDir: paths.dist,
    cacheDir: paths.nwcache,
    files: path.join(paths.build, '**/*'),
    // macCredits: 'path/to/credits.html'
    // macIcns: 'img/icon.icns',
    platforms: ['osx64'],
    version: nw_pkg.version,
  });

  nw.on('log', gutil.log);

  return nw.build().catch(gutil.log);
});