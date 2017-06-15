'use strict';

import gulp from 'gulp';

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


gulp.task('build', ['copy']);

gulp.task('deploy', () => {
  return gulp
      .src(['./build/**/*'])
      .pipe(deploy({
          	remoteUrl: "https://eduardsi:${GH_TOKEN}@github.com/devternity/devternity.com"
          }));
});

gulp.task('default', ['build']);
