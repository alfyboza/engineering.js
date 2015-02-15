var coveralls = require('gulp-coveralls');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('lint', function () {
  return gulp
    .src(['lib/*.js', 'test/*.test.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', ['lint'], function () {
  return gulp
    .src('test/*.test.js', {read: false})
    .pipe(mocha());
});

gulp.task('instrument', function (done) {
  gulp
    .src('lib/*.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp
        .src('test/*.test.js', {read: false})
        .pipe(mocha({reporter: 'dot'}))
        .pipe(istanbul.writeReports())
        .on('end', done);
    });
});

gulp.task('coveralls', ['instrument'], function () {
  return gulp
    .src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('watch', function () {
  gulp.watch(['lib/*.js', 'test/*.test.js'], ['test']);
});
