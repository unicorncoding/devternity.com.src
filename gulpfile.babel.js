'use strict';

import pug from "gulp-pug2"
import gulp from 'gulp'
import connect from 'gulp-connect'
import merge from 'merge-stream'
import gulpif from 'gulp-if'
import ghpages from 'gh-pages'
import moment from 'moment'
import fs from "fs"
import _ from "lodash"
import purgecss from 'gulp-purgecss'
import htmlToText from 'html-to-text'
import runSequence from 'run-sequence'

const events = [
    {loc: "rix/2015", history: []},
    {loc: "rix/2016", history: []},
    {loc: "rix/2017", history: ["2016", "2015"]},
    {loc: "rix/2018", history: ["2017", "2016", "2015"]},
    {loc: "rix/2019", history: ["2018", "2017", "2016", "2015"], current: true}
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
        var content = fs.readFileSync(`events/${loc}/js/event.js`, "utf8")
        var [json] = JSON.parse(content)
        return json
    } catch (err) {
        console.log(err)
        return {}
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

        let newLine = '\r\n'
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
                    let tags = (event.tags ? event.tags : []).map(tag => `#${tag}`).join(' ')
                    let desc = event.description ? htmlToText.fromString(tags + '<br><br>' + event.description, {wordwrap: false}) : ''
                    return {
                      start: new Date(year, month - 1, day, startHour, startMinute, 0),
                      end: new Date(year, month - 1, day, endHour, endMinute, 0),
                      summary: `${event.title}${speaker}`,
                      description: desc,
                      location: event.location ? event.location : `DevTernity ${track.trim()}`,
                      url: event_js.selfLink,
                      organizer: {
                        name: 'DevTernity Team',
                        email: 'hello@devternity.com'
                      }  
                    }
                })
            })
        })

        let icalToolkit = require('ical-toolkit')
        let builder = icalToolkit.createIcsFileBuilder()
        builder.throwError = true
        builder.NEWLINE_CHAR = newLine
        builder.ignoreTZIDMismatch = false

        builder.calname = event_js.theme
        builder.prodid = event_js.theme
        builder.timezone = 'europe/riga'
        builder.tzid = 'europe/riga'


        calendarEvents.forEach(e => {
          builder.events.push(e)
        })
        let base = event.current ? dirs.dest : `${dirs.dest}/${event.loc}`
        fs.writeFileSync(`${__dirname}/${base}/cal.ics`, builder.toString());
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

gulp.task('connect', () => {
    connect.server({
        root: 'build'
    });
});

gulp.task('watch', () => {
    gulp.watch(["event-template/**/*", "events/**/*"], ['build']);
});


// it is important, that purgecss runs after there are files in ./build
gulp.task('build', function (cb) {
    runSequence('events', 'generate-calendar', 'copy-statics', cb)
});

gulp.task('deploy', ['ghPages']);


gulp.task('ghPages', (cb) => {
    ghpages.publish('./build', {
        repo: "https://eduardsi:${GH_TOKEN}@github.com/devternity/devternity.github.io.git",
        branch: "master"
    }, cb)
});

gulp.task('default', ['build', 'watch', 'connect']);
