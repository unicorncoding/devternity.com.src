'use strict';

import pug from "gulp-pug2"
import gulp from 'gulp'
import deploy from 'gulp-gh-pages'
import connect from 'gulp-connect'
import merge from 'merge-stream'
import gulpif from 'gulp-if'
import moment from 'moment'
import newer from 'gulp-newer'
import fs from "fs"
import _ from "lodash"
import purgecss from 'gulp-purgecss'
import imagemin from 'gulp-imagemin'
import htmlToText from 'html-to-text'
import runSequence from 'run-sequence'

const events = [
    {loc: "rix/2015", history: []},
    {loc: "rix/2016", history: []},
    {loc: "rix/2017", history: ["2016", "2015"]},
    {loc: "rix/2018", history: ["2017", "2016", "2015"], current: true}
];

const eventsNewOnly = events.filter(event => !event.loc.includes('2015') && !event.loc.includes('2016'))

const dirs = {
    dest: 'build',
    statics: [,
        'CNAME'
    ]
};

const css = {
    src: 'event-template/css/*.css',
    dest: 'build/css',
    html: 'build/index.html'
};

const images = {
    src: 'event-template/images/*',
    dest: 'build/images'
};

const eventJs = (loc) => {
    try {
        var content = fs.readFileSync(`events/${loc}/js/event.js`, "utf8");
        var json = JSON.parse(content)[0];
        return json;
    } catch (err) {
        console.log(err);
        return {};
    }
};

gulp.task('copy-statics', () => {
    return gulp
        .src(dirs.statics, {base: '.'})
        .pipe(gulp.dest(dirs.dest));

});

gulp.task('copy-events', () => {
    return merge(eventsNewOnly.map(event => {
        console.log(`Copying event template for ${event.loc}`);
        let event_js = eventJs(event.loc);
        let talks = event_js.program
            .find(it => it.event === "keynotes")
            .schedule
            .map(it => _.extend(it, {uid: _.uniqueId()}));
    
        let workshops = event_js.program
            .find(it => it.event === "workshops")
            .schedule
            .map(it => _.extend(it, it.tags ? {tagList: it.tags.map(it => `#${it}`).join(' ')} : {}));
    
        let speakers = talks
            .filter(it => it.type === "speech")
            .map(it => _.extend(it, it.tags ? {tagList: it.tags.map(it => `#${it}`).join(' ')} : {}))
            .map(it => [it, it.partner])
            .reduce((it, that) => it.concat(that))
            .filter(it => it);

        let speakersInRows = _.chunk(speakers, 4);
        let hasUnknownSpeakers = talks.some(it => it.type === "speech" && !it.name);
        let hasUnknownWorkshops = workshops.length < event_js.workshops_total;

        return gulp
            .src('event-template/**/*', {base: 'event-template'})
            .pipe(gulpif(/.pug/, pug({
                data: _.extend({
                    days: _(event_js.duration_days).times(n => moment(event_js.date_iso).add(n, 'days').format("D MMM YYYY")),
                    speakersInRows: speakersInRows,
                    hasUnknownSpeakers: hasUnknownSpeakers,
                    hasUnknownWorkshops: hasUnknownWorkshops,
                    workshops: workshops,
                    talks: _.groupBy(talks, 'time'),
                }, event_js, event)
            })))
            .pipe(event.current ? gulp.dest(`build`) : gulp.dest(`build/${event.loc}`))
    }))
});

gulp.task('generate-calendar', () => {

    eventsNewOnly.map(event => {

        let event_js = eventJs(event.loc);

        let calendarEvents = _.flatMap(event_js.program, conferenceDay => {
            let [year, month, day] = conferenceDay.date_iso.split('-')
            let chronoTimes = _.uniq(conferenceDay.schedule.map(event => event.time))

            let talks = _.groupBy(conferenceDay.schedule.filter(event => event.title), 'time')

            return _.flatMap(talks, (events, time) => {
                return events.map((event, index) => {
                    let [startHour, startMinute] = time.split(":")

                    let track = events.length == 3 ? `(Track ${index + 1}) ` : ''
                    let endTime = event.endTime ? event.endTime : chronoTimes[chronoTimes.indexOf(time) + 1]
                    let [endHour, endMinute] = endTime.split(":")

                    let speaker = event.name ? ` (${event.name})` : ''
                    return {
                        productId: event_js.theme,
                        organizer: {name: 'DevTernity Team', email: 'hello@devternity.com'},
                        title: `${track}${event.title}${speaker}`,
                        start: [year, month, day, startHour, startMinute],
                        end: [year, month, day, endHour, endMinute],
                        url: event_js.selfLink,
                        description: event.description ? htmlToText.fromString(event.description, {wordwrap: false}) : '',
                        categories: event.tags ? event.tags : [],
                        location: event.location ? event.location : `DevTernity ${track.trim()}`,
                    }
                })
            })
        })

        let { error, value } = require('ics').createEvents(calendarEvents)
        let base = event.current ? dirs.dest : `${dirs.dest}/${event.loc}`
        fs.writeFileSync(`${__dirname}/${base}/cal.ics`, value);        
    })
})

gulp.task('events', ['copy-events'], () => {
    return merge(events.map(event => {
        console.log(`Overriding ${event.loc} with specifics files`)
        var base = event.current ? `events/${event.loc}` : 'events'
        return gulp
            .src(`events/${event.loc}/**/*`, {base: base})
            .pipe(gulp.dest(dirs.dest))
    }))
});

gulp.task('purgecss', () =>
    gulp.src(css.src)
        .pipe(purgecss({
            content: [css.html]
        }))
        .pipe(gulp.dest(css.dest))
);

gulp.task('imagemin', () =>
    gulp.src(images.src)
        .pipe(newer(images.dest))
        .pipe(imagemin())
        .pipe(gulp.dest(images.dest))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
);

gulp.task('connect', () => {
    connect.server({
        root: 'build'
    });
});

gulp.task('watch', () => {
    gulp.watch(["event-template/**/*", "events/**/*"], ['build']);
});

gulp.task('min', ['imagemin']);
// gulp.task('build', ['events', 'copy-statics']);

// it is important, that purgecss runs after there are files in ./build
gulp.task('build', function (cb) {
    runSequence('events', 'generate-calendar', 'copy-statics', 'min', cb)
});

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
