var coveralls = require('gulp-coveralls');
var del = require('del');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var open = require('gulp-open');
var mocha = require('gulp-mocha');
var stylish = require('jshint-stylish');

var paths = {
  sources: ['lib/*.js'],
  tests: ['test/**/*.js']
};

gulp.task('clean', function (done) {
  del(['coverage'], done);
});

gulp.task('lint', function () {
  return gulp
    .src([__dirname].concat(paths.sources, paths.tests))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});

gulp.task('test', ['lint'], function () {
  return gulp
    .src(paths.tests, {read: false})
    .pipe(mocha());
});

gulp.task('instrument:prepare', ['clean'], function () {
  return gulp
    .src(paths.sources)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('instrument:run', ['instrument:prepare'], function () {
  return gulp
    .src(paths.tests, {read: false})
    .pipe(mocha({reporter: 'dot'}))
    .pipe(istanbul.writeReports());
});

gulp.task('instrument', ['instrument:run']);

gulp.task('coverage', ['instrument'], function () {
  return gulp
    .src('coverage/lcov-report/index.html')
    .pipe(open());
});

gulp.task('coveralls', ['instrument'], function () {
  return gulp
    .src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('watch', function () {
  gulp.watch(paths.sources.concat(paths.tests), ['test']);
});

gulp.task('default', ['test']);
