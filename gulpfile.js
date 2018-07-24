'use strict';

var gulp = require('gulp');

var tinypngFree = require('./index');

gulp.task('test', function(cb) {
	gulp.src('test/img/*')
		.pipe(tinypngFree({
			signFile: 'test/img/sign.json'
		}))
		.pipe(gulp.dest('test/dist'));
});