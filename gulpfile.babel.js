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
import moment from 'moment'
import glob from 'glob';
import path from 'path';
import fs from "fs";
import _ from "lodash"
import readFile from "fs-readfile-promise"


const events = [
  { loc: "rix/2015", history: [] },
  { loc: "rix/2016", history: [] },
  { loc: "rix/2017", history: ["2016", "2015"] },
  { loc: "rix/2018", history: ["2017", "2016", "2015"], current: true}
];

const dirs = {
  dest: 'build',
  statics: [,
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
      .src(dirs.statics, {base: '.'})
      .pipe(gulp.dest(dirs.dest));

});

gulp.task('copy-events', () => {
  return merge(events.filter(event => !event.loc.includes('2015') && !event.loc.includes('2016')).map(event => {
    console.log(`Copying event template for ${event.loc}`)
    let event_js = eventJs(event.loc)
    let talks = event_js.program
                    .find(it => it.event === "keynotes")
                    .schedule
                    .map(it => _.extend(it, {uid: _.uniqueId()}))

    let workshops = event_js.program
                    .find(it => it.event === "workshops")
                    .schedule

    let speakers = talks
        .filter(it => it.type === "speech")
        .map(it => _.extend(it, it.tags ? {tagList: it.tags.map(it => `#${it}`).join(' ')} : {}))
        .map(it => [it, it.partner])
        .reduce((it, that) => it.concat(that))
        .filter(it => it)

    let speakersInRows = _.chunk(speakers, 4)
    let hasUnknownSpeakers = talks.some(it => it.type === "speech" && !it.name)
    let hasUnknownWorkshops = workshops.length < event_js.workshops_total
  
    return gulp
        .src('event-template/**/*', {base: 'event-template'})    
        .pipe(gulpif(/.pug/, pug({data: _.extend({
          build_time_iso: new Date().toISOString(),
          days: _(event_js.duration_days).times(n => moment(event_js.date_iso).add(n, 'days').format("D MMM YYYY")),
          speakersInRows: speakersInRows,
          hasUnknownSpeakers: hasUnknownSpeakers,
          hasUnknownWorkshops: hasUnknownWorkshops,
          workshops: workshops,
          talks: _.groupBy(talks, 'time')
        }, event_js, event) })))
        .pipe(event.current ? gulp.dest(`build`) : gulp.dest(`build/${event.loc}`))
  }))
});

gulp.task('events', ['copy-events'], () => {
  return merge(events.map(event => {
    console.log(`Overriding ${event.loc} with specifics files`)
    var base = event.current ? `events/${event.loc}` : 'events'
    return gulp
      .src(`events/${event.loc}/**/*`, {base: base})
      .pipe(gulp.dest(dirs.dest))
  }))  
})

gulp.task('connect', () => {
  connect.server({
    root: 'build'
  });
});

gulp.task('watch', () => {
  gulp.watch(["event-template/**/*", "events/**/*"], ['build']);
});


gulp.task('build', ['events', 'copy-statics']);
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
