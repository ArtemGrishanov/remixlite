const projectFolder = 'dist';
const sourceFolder = 'src';

const path = {
    build: {
        html: `${projectFolder}/`,
        css: `${projectFolder}/`,
        js: `${projectFolder}/`
    },
    src: {
        html: `${sourceFolder}/main.html`,
        css: `${sourceFolder}/styles/main.scss`,
        js: `${sourceFolder}/scripts/main.js`
    },
    watch: {
        html: `${sourceFolder}/**/*.html`,
        css: `${sourceFolder}/**/*.scss`,
        js: `${sourceFolder}/**/*.js`
    },
    clean: `./${projectFolder}/`
}

const gulp = require('gulp'),
    browser_sync = require('browser-sync').create(),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

function clean() {
    return del(path.clean)
}

function html() {
    return gulp.src(path.src.html)
        .pipe(
            rename({
                basename: "rlite",
                extname: '.html'
            })
        )
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(path.build.html))
}
function htmlLight() {
    return gulp.src(path.src.html)
        .pipe(
            rename({
                basename: "rlite",
                extname: '.html'
            })
        )
        .pipe(gulp.dest(path.build.html))
        .pipe(browser_sync.stream())
}
function css() {
    return gulp.src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(group_media())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(clean_css())
        .pipe(
            rename({
                basename: "rlite",
                extname: '.css'
            })
        )
        .pipe(gulp.dest(path.build.css))
        .pipe(browser_sync.stream())
}
function cssLight() {
    return gulp.src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(
            rename({
                basename: "rlite",
                extname: '.css'
            })
        )
        .pipe(gulp.dest(path.build.css))
}
function js() {
    return browserify(path.src.js)
        .transform(babelify.configure({
            presets: ['@babel/env']
        }))
        .bundle()
        .pipe(source('rlite.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js))
        .pipe(browser_sync.stream());
}
function jsLight() {
    return browserify(path.src.js)
        .transform(babelify.configure({
            presets: ['@babel/env']
        }))
        .bundle()
        .pipe(source('rlite.js'))
        .pipe(gulp.dest(path.build.js))
}

function watchFiles() {
    gulp.watch([path.watch.html], htmlLight)
    gulp.watch([path.watch.css], cssLight)
    gulp.watch([path.watch.js], jsLight)
}

function browserSync() {
    browser_sync.init({
        server: {
            baseDir: path.clean
        },
        port: 8090,
        notify: false,
        ui: false,
        open: false
    })
}

const build = gulp.series(clean, gulp.parallel(html, css, js));
const buildLight = gulp.series(clean, gulp.parallel(htmlLight, cssLight, jsLight));
const watch = gulp.parallel(buildLight, watchFiles, browserSync);

exports.build = build
exports.watch = watch
exports.default = watch