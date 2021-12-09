const gulp = require('gulp');
const del = require('del');

gulp.task('copy', function () {
	return gulp
		.src(['./src/**/*.json', './src/test/*', './src/**/*.doc.js', './src/**/*.jpg', './src/**/*.txt'], {
			base: './src/'
		})
		.pipe(gulp.dest('./dist/'));
});

gulp.task('clean', function () {
	return del(['./dist/**/*']);
});
