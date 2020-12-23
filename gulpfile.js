const projectFolder = 'dist';
const sourceFolder = 'src';

const path = {
    build: {
        typeFiles: {
            html: `${projectFolder}/typeFiles/`,
            css: `${projectFolder}/typeFiles/`,
            js: `${projectFolder}/typeFiles/`,
        },
        loader: `${projectFolder}/loader/`,
    },
    src: {
        typeFiles: {
            html: `${sourceFolder}/typeFiles/html/main.html`,
            css: `${sourceFolder}/typeFiles/css/main.scss`,
            js: `${sourceFolder}/typeFiles/js/main.js`,
        },
        loader: `${sourceFolder}/loader/main.js`,
    },
    watch: {
        typeFiles: {
            html: `${sourceFolder}/typeFiles/**/*.html`,
            css: `${sourceFolder}/typeFiles/**/*.scss`,
            js: `${sourceFolder}/typeFiles/**/*.js`,
        },
        loader: `${sourceFolder}/loader/**/*.js`,
    },
    clean: `./${projectFolder}/`
}

const gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    groupMedia = require('gulp-group-css-media-queries'),
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

const fConstants = {
    typeFiles: {
        html: {
            build: "[BUILD] typeFiles.html",
            watch: "[WATCH] typeFiles.html"
        },
        css: {
            build: "[BUILD] typeFiles.css",
            watch: "[WATCH] typeFiles.css"
        },
        js: {
            build: "[BUILD] typeFiles.js",
            watch: "[WATCH] typeFiles.js"
        }
    },
    loader: {
        build: "[BUILD] loader",
        watch: "[WATCH] loader"
    },
}
const f = {
    // ProjectType Files
    typeFiles: {
        html: {
            [fConstants.typeFiles.html.build]: () => {
                return gulp.src(path.src.typeFiles.html)
                    .pipe(
                        rename({
                            basename: "main",
                            extname: '.html'
                        })
                    )
                    .pipe(htmlmin({collapseWhitespace: true}))
                    .pipe(gulp.dest(path.build.typeFiles.html))
            },
            [fConstants.typeFiles.html.watch]: () => {
                return gulp.src(path.src.typeFiles.html)
                    .pipe(
                        rename({
                            basename: "main",
                            extname: '.html'
                        })
                    )
                    .pipe(gulp.dest(path.build.typeFiles.html))
            }
        },
        css: {
            [fConstants.typeFiles.css.build]: () => {
                return gulp.src(path.src.typeFiles.css)
                    .pipe(
                        scss({
                            outputStyle: 'expanded'
                        })
                    )
                    .pipe(groupMedia())
                    .pipe(
                        autoprefixer({
                            overrideBrowserslist: ["last 5 versions"],
                            cascade: true
                        })
                    )
                    .pipe(cleanCss())
                    .pipe(
                        rename({
                            basename: "main",
                            extname: '.css'
                        })
                    )
                    .pipe(gulp.dest(path.build.typeFiles.css))
            },
            [fConstants.typeFiles.css.watch]: () => {
                return gulp.src(path.src.typeFiles.css)
                    .pipe(
                        scss({
                            outputStyle: 'expanded'
                        })
                    )
                    .pipe(
                        rename({
                            basename: "main",
                            extname: '.css'
                        })
                    )
                    .pipe(gulp.dest(path.build.typeFiles.css))
                    .pipe(browserSync.stream())
            }
        },
        js: {
            [fConstants.typeFiles.js.build]: () => {
                return browserify(path.src.typeFiles.js)
                    .transform(babelify.configure({
                        presets: ['@babel/env']
                    }))
                    .bundle()
                    .pipe(source('main.js'))
                    .pipe(buffer())
                    .pipe(uglify())
                    .pipe(gulp.dest(path.build.typeFiles.js))
            },
            [fConstants.typeFiles.js.watch]: () => {
                return browserify(path.src.typeFiles.js)
                    .transform(babelify.configure({
                        presets: ['@babel/env']
                    }))
                    .bundle()
                    .pipe(source('main.js'))
                    .pipe(gulp.dest(path.build.typeFiles.js))
                    .pipe(browserSync.stream())
            }
        },
    },
    // Loader
    loader: {
        [fConstants.loader.build]: () => {
            return browserify(path.src.loader)
                .transform(babelify.configure({
                    presets: ['@babel/env'],
                    plugins: [['@babel/plugin-proposal-class-properties']]
                }))
                .bundle()
                .pipe(source('index.js'))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest(path.build.loader))
        },
        [fConstants.loader.watch]: () => {
            return browserify(path.src.loader)
                .transform(babelify.configure({
                    presets: ['@babel/env'],
                    plugins: [['@babel/plugin-proposal-class-properties']]
                }))
                .bundle()
                .pipe(source('index.js'))
                .pipe(gulp.dest(path.build.loader))
                .pipe(browserSync.stream());
        }
    }
}

function watchFiles() {
    gulp.watch([path.watch.typeFiles.html], f.typeFiles.html[fConstants.typeFiles.html.watch])
    gulp.watch([path.watch.typeFiles.css], f.typeFiles.css[fConstants.typeFiles.css.watch])
    gulp.watch([path.watch.typeFiles.js], f.typeFiles.js[fConstants.typeFiles.js.watch])
    gulp.watch([path.watch.loader], f.loader[fConstants.loader.watch])
}

function sync() {
    browserSync.init({
        server: {
            baseDir: path.clean
        },
        port: 8090,
        notify: false,
        ui: false,
        open: false
    })
}

function clean() {
    return del(path.clean)
}

const build = gulp.series(
    clean,
    gulp.parallel(
        f.typeFiles.html[fConstants.typeFiles.html.build],
        f.typeFiles.css[fConstants.typeFiles.css.build],
        f.typeFiles.js[fConstants.typeFiles.js.build],
        f.loader[fConstants.loader.build]
    )
);
const watch = gulp.parallel(
    gulp.series(
        clean,
        gulp.parallel(
            f.typeFiles.html[fConstants.typeFiles.html.watch],
            f.typeFiles.css[fConstants.typeFiles.css.watch],
            f.typeFiles.js[fConstants.typeFiles.js.watch],
            f.loader[fConstants.loader.watch]
        )
    ),
    watchFiles,
    sync
);

exports.build = build
exports.watch = watch
exports.default = watch