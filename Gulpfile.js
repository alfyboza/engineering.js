var gulp = require('gulp');
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

gulp.task('watch', function () {
  gulp.watch(['lib/*.js', 'test/*.test.js'], ['test']);
});
