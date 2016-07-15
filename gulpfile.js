var gulp = require('gulp');
var del = require('del');
var browserSync = require('browser-sync').create();
var gulpLoadPlugins = require('gulp-load-plugins');
var $ = gulpLoadPlugins();
var mainBowerFiles = require('main-bower-files');
var revAll = new $.revAll({dontRenameFile: ['.html', '.eot', '.woff', '.svg', '.ttf']});

// Lint the SCSS files. Config is found in the root of the project directory.
gulp.task('scss-lint', function() {
  return gulp.src('./dev/stylesheets/**/*.scss')
    .pipe($.scssLint({
      config: '.scss-lint.yml'
    }));
});

// Compile the SASS stylesheets and compress them right away.
gulp.task('styles', function() {
  gulp.src('./dev/stylesheets/*.scss')
  .pipe($.plumber())
  .pipe($.sass({outputStyle: 'compressed'}).on('error', $.sass.logError))
  .pipe(gulp.dest('./css/'))
  .pipe(browserSync.stream());
});

// Concatenate all the files in the scripts directory, uglify and move them.
gulp.task('js', function() {
  return gulp.src(['./dev/scripts/**/*.js', '!./dev/scripts/vendor/**/*.js'])
    .pipe($.concat('main.js'))
    .pipe($.uglify())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest('./js/'))
});

// Concatenate all the files in the vendor directory, uglify and move them.
gulp.task('js-vendor', ['main-bower-files'], function() {
  return gulp.src('./dev/scripts/vendor/**/*.js')
    .pipe($.concat('vendor.js'))
    .pipe($.uglify())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest('./js/'));
})

// Lint the files in the script directory.
gulp.task('lint', function() {
  return gulp.src(['./dev/scripts/**/*.js', '!./dev/scripts/vendor/**/*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format());
});

// Make sure the JS tasks are done before reloading the browser.
gulp.task('js-watch', ['js'], function() {
  browserSync.reload();
});

gulp.task('js-vendor-watch', ['js-vendor'], function() {
  browserSync.reload();
});

// Put the main bower files in the vendor directory.
// It will also put dependencies in the vendor folder so make sure you overwrite the dependencies in your bower.json if you don't want this to happen.
gulp.task('main-bower-files', function() {
  return gulp.src(mainBowerFiles('**/*.js'))
    .pipe(gulp.dest('./dev/scripts/vendor/'));
});

// Optimize all the images. Note that this is not part of the actual building process. This task has to be run manually.
// If you want to add it to the build task you should add it to it's second argument array.
// But please note that this overwrites(!) your images (personal preference). If you don't want that to happen, change the destination folder (maybe work with a .tmp folder or something).
gulp.task('images', function() {
  return gulp.src('./images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('./images'));
});

gulp.task('serve', ['styles', 'js', 'js-vendor'], function() {
  browserSync.init({
    proxy: "localhost/gulp-base-project" // Directory where your main index.html is located.
  });

  gulp.watch('./dev/stylesheets/**/*.scss', ['styles', 'scss-lint']);
  gulp.watch(['./dev/scripts/**/*.js', '!./dev/scripts/vendor/*.js'], ['js-watch', 'lint']);
  gulp.watch(['./dev/scripts/vendor/*.js'], ['js-vendor-watch']);
  gulp.watch([
    './**/*.html',
    './images/**/*'
  ]).on('change', browserSync.reload);
});

// Remove the dist folder so it can make place for a new one.
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Build the project with file revisioning.
gulp.task('build', ['styles', 'js'], function() {
  return gulp.src(['./css/**/*', './js/**/*', './images/**/*', './**/*.html', '!./node_modules/**/*', '!./bower_components/**/*'])
    .pipe(revAll.revision())
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function() {
  gulp.start('build');
});
