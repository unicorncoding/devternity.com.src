'use strict';

import pug from "gulp-pug2"
import rev from 'gulp-rev';
import gulp from 'gulp';
import data from "gulp-data"
import deploy from 'gulp-gh-pages';
import connect from 'gulp-connect';
import merge from 'merge-stream';
import gulpif from 'gulp-if';
import gulpIgnore from 'gulp-ignore';
import glob from 'glob';
import path from 'path';
import fs from "fs";
import _ from "lodash"
import readFile from "fs-readfile-promise"


const events = [
  { loc: "rix/2015", history: [] },
  { loc: "rix/2016", history: [] },
  { loc: "rix/2017", front: true, history: ["2016", "2015"] },
  { loc: "rix/2018", front: true, history: ["2017", "2016", "2015"] }
  // { loc: "ber/2018", front: true, history: [] }
];

const dirs = {
  dest: 'build',
  sources: [,
      'CNAME'
    ]  
};

const eventJs = (loc) => {
    try {
      var content = fs.readFileSync(`events/${loc}/js/event.js`, "utf8")
      var json = JSON.parse(content)[0];
      return json;
    } catch (err) {
        console.log(err);
        return {};
    }
}

gulp.task('copy-statics', () => {
  return gulp
      .src(dirs.sources, {base: '.'})
      .pipe(gulp.dest(dirs.dest));

});


gulp.task('copy-events', () => {
  return events.map(event => {
    console.log(`Copying event template for ${event.loc}`)
    gulp
      .src('event-template/**/*', {base: 'event-template'})    
      .pipe(gulpif(/.pug/, pug({data: _.extend({}, eventJs(event.loc), event) })))
      .pipe(gulp.dest(`build/${event.loc}`))
  })  
 
});

gulp.task('override-events', () => {
  return events.map(event => {
    console.log(`Overriding ${event.loc} with specifics files`)
    gulp
      .src(`events/${event.loc}/**/*`, {base: 'events'})
      .pipe(gulp.dest(dirs.dest))
  })  
})

gulp.task('copy-welcome', () => {
  var allJsons = events
    .filter(e => { return e.front })
    .map(e => { return _.extend({}, eventJs(e.loc), e) });

  return events.map(event => {
    gulp
      .src(`welcome/**/*`, {base: 'welcome'})
      .pipe(gulpif(/.pug/, pug({data: allJsons})))
      .pipe(gulp.dest(dirs.dest))
  })  
});

gulp.task('connect', () => {
  connect.server({
    root: 'build'
  });
});

gulp.task('watch', function () {
  gulp.watch(["event-template/**/*", "events/**/*", "welcome/**/*"], ['build']);
});


gulp.task('build', ['copy-events', 'override-events', 'copy-welcome', 'copy-statics']);
gulp.task('deploy', ['ghPages']);


gulp.task('ghPages', () => {
  return gulp
      .src(['./build/**/*'])
      .pipe(deploy({
          	remoteUrl: "https://eduardsi:${GH_TOKEN}@github.com/devternity/devternity.github.io.git",
            branch: "master"
          }));
});

gulp.task('default', ['build', 'watch', 'connect']);
