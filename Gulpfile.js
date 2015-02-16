var coveralls = require('gulp-coveralls');
var del = require('del');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var open = require('gulp-open');

gulp.task('clean', function (done) {
  del(['coverage'], done);
});

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

gulp.task('instrument', ['clean'], function (done) {
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

gulp.task('coverage', ['instrument'], function () {
  gulp
    .src('coverage/lcov-report/index.html')
    .pipe(open());
});

gulp.task('coveralls', ['instrument'], function () {
  return gulp
    .src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('watch', function () {
  gulp.watch(['lib/*.js', 'test/*.test.js'], ['test']);
});
