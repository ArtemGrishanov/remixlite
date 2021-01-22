const projectFolder = 'dist';
const projectFolderTmp = 'dist/tmp';
const sourceFolder = 'src';

const path = {
    build: {
        _tmp: {
            typeFiles: `${projectFolderTmp}/typeFiles`,
        },
        remix: `${projectFolder}/`,
        loader: `${projectFolder}/`,
    },
    src: {
        typeFiles: {
            html: `${sourceFolder}/typeFiles/html/main.html`,
            css: `${sourceFolder}/typeFiles/css/main.scss`,
            js: `${sourceFolder}/typeFiles/js/main.js`,
        },
        loader: `${sourceFolder}/loader/index.js`,
    },
    watch: {
        typeFiles: {
            html: `${sourceFolder}/typeFiles/**/*.html`,
            css: `${sourceFolder}/typeFiles/**/*.scss`,
            js: `${sourceFolder}/typeFiles/**/*.js`,
        },
        loader: `${sourceFolder}/loader/**/*.js`,
    },
    clean: {
        projectFolder: `./${projectFolder}/`,
        projectFolderTmp: `./${projectFolderTmp}/`
    }
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
    buffer = require('vinyl-buffer'),
    inject = require('gulp-inject'),
    replace = require('gulp-replace');

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
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
            },
            [fConstants.typeFiles.html.watch]: () => {
                return gulp.src(path.src.typeFiles.html)
                    .pipe(
                        rename({
                            basename: "main",
                            extname: '.html'
                        })
                    )
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
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
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
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
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
            }
        },
        js: {
            [fConstants.typeFiles.js.build]: () => {
                return browserify(path.src.typeFiles.js)
                    .transform(babelify.configure({
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
                    }))
                    .bundle()
                    .pipe(source('main.js'))
                    .pipe(buffer())
                    .pipe(uglify({
                        output: {
                            quote_style: 1
                        }
                    }))
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
            },
            [fConstants.typeFiles.js.watch]: () => {
                return browserify(path.src.typeFiles.js)
                    .transform(babelify.configure({
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
                    }))
                    .bundle()
                    .pipe(source('main.js'))
                    .pipe(gulp.dest(path.build._tmp.typeFiles))
            }
        },
    },
    // Loader
    loader: {
        [fConstants.loader.build]: () => {
            return browserify(path.src.loader)
                .transform(babelify.configure({
                    presets: ['@babel/env'],
                    plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
                }))
                .bundle()
                .pipe(source('loader.js'))
                .pipe(buffer())
                .pipe(uglify({
                    output: {
                        quote_style: 1
                    }
                }))
                .pipe(gulp.dest(path.build.loader))
        },
        [fConstants.loader.watch]: () => {
            return browserify(path.src.loader)
                .transform(babelify.configure({
                    presets: ['@babel/env'],
                    plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
                }))
                .bundle()
                .pipe(source('loader.js'))
                .pipe(replace('___API_URL___', `"${process.env.API_URL}"`))
                .pipe(gulp.dest(path.build.loader))
                .pipe(browserSync.stream());
        }
    }
}

const bundleRemix = () => (
    gulp.src(`${path.build._tmp.typeFiles}/main.html`)
        .pipe(inject(gulp.src(`${path.build._tmp.typeFiles}/main.css`), {
            starttag: '/* start-inject:css */',
            endtag: '/* end-inject:css */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8')
            }
        }))
        .pipe(inject(gulp.src(`${path.build._tmp.typeFiles}/main.js`), {
            starttag: '/* start-inject:js */',
            endtag: '/* end-inject:js */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8')
            }
        }))
        .pipe(
            rename({
                basename: "remix",
                extname: '.html'
            })
        )
        .pipe(gulp.dest(path.build.remix))
)

function watchFiles() {
    gulp.watch(
        [path.watch.typeFiles.html],
        gulp.series(
            gulp.parallel(
                f.typeFiles.html[fConstants.typeFiles.html.watch]
            ),
            bundleRemix,
        )
    )
    gulp.watch(
        [path.watch.typeFiles.css],
        gulp.series(
            gulp.parallel(
                f.typeFiles.css[fConstants.typeFiles.css.watch]
            ),
            bundleRemix,
        )
    )
    gulp.watch(
        [path.watch.typeFiles.js],
        gulp.series(
            gulp.parallel(
                f.typeFiles.js[fConstants.typeFiles.js.watch]
            ),
            bundleRemix,
        )
    )
    gulp.watch(
        [path.watch.loader],
        f.loader[fConstants.loader.watch]
    )
}

function sync() {
    browserSync.init({
        server: {
            baseDir: path.clean.projectFolder
        },
        port: 8090,
        notify: false,
        ui: false,
        open: false
    })
}

function cleanProjectFolder() {
    return del(path.clean.projectFolder)
}
function cleanProjectFolderTmp() {
    return del(path.clean.projectFolderTmp)
}

const build = gulp.series(
    cleanProjectFolder,
    gulp.parallel(
        f.typeFiles.html[fConstants.typeFiles.html.build],
        f.typeFiles.css[fConstants.typeFiles.css.build],
        f.typeFiles.js[fConstants.typeFiles.js.build],
        f.loader[fConstants.loader.build]
    ),
    bundleRemix,
    cleanProjectFolderTmp,
);
const watch = gulp.parallel(
    gulp.series(
        cleanProjectFolder,
        gulp.parallel(
            f.typeFiles.html[fConstants.typeFiles.html.watch],
            f.typeFiles.css[fConstants.typeFiles.css.watch],
            f.typeFiles.js[fConstants.typeFiles.js.watch],
            f.loader[fConstants.loader.watch]
        ),
        bundleRemix
    ),
    watchFiles,
    sync
);

exports.build = build
exports.watch = watch
exports.default = watch