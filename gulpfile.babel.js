'use strict';

import rev from 'gulp-rev';
import gulp from 'gulp';
import deploy from 'gulp-gh-pages';
import connect from 'gulp-connect';

const dirs = {
  dest: 'build'
};

gulp.task('copy', () => {
  return gulp
      .src([
        '2015/**/*',
        '2016/**/*',
        'css/**/*',
        'fonts/**/*',
        'images/**/*',
        'js/**/*',
        'opening/**/*',
        'shields/**/*',
        'sponsorship/**/*',
        'CNAME',
        '*.html'
      ], {base: '.'})
      .pipe(gulp.dest(dirs.dest));
});

gulp.task('connect', () => {
  connect.server({
    root: 'build', 
    livereload: true
  });
});


gulp.task('build', ['copy']);
gulp.task('deploy', ['ghPages']);


gulp.task('ghPages', () => {
  return gulp
      .src(['./build/**/*'])
      .pipe(deploy({
          	remoteUrl: "https://eduardsi:${GH_TOKEN}@github.com/devternity/devternity.github.io.git",
            branch: "master"
          }));
});

gulp.task('default', ['build', 'connect']);
