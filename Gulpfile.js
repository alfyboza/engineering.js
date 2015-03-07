var coveralls = require('gulp-coveralls');
var del = require('del');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var open = require('gulp-open');
var shell = require('gulp-shell');
var stylish = require('jshint-stylish');

var paths = {
  sources: ['lib/*.js'],
  tests: ['test/*.test.js']
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

gulp.task('test', ['lint'], shell.task('mocha'));

gulp.task('instrument', ['clean'], function (done) {
  gulp
    .src(paths.sources)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp
        .src(paths.tests, {read: false})
        .pipe(shell('mocha --reporter dot'))
        .pipe(istanbul.writeReports())
        .on('end', done);
    });
});

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
