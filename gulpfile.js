var gulp = require('gulp'),
		pug = require('gulp-pug'),
		sass = require('gulp-sass'),
		concat = require('gulp-concat'),
		plumber = require('gulp-plumber'),
		prefix = require('gulp-autoprefixer'),
		imagemin = require('gulp-imagemin'),
		browserSync = require('browser-sync').create();

var useref = require('gulp-useref'),
		gulpif = require('gulp-if'),
		cssmin = require('gulp-clean-css'),
		uglify = require('gulp-uglify'),
		rimraf = require('rimraf'),
		notify = require('gulp-notify'),
		ftp = require('vinyl-ftp');

var paths = {
			blocks: 'blocks/',
			devDir: 'app/',
			outputDir: 'build/'
    };

		/*********************************
				Developer tasks/ Разработка
		*********************************/

// pug compile/ компилируем pug
gulp.task('pug', function(){
	return gulp.src([
		paths.blocks + '*.pug',
		'!' + paths.blocks + 'template.pug'])
		.pipe(plumber())
		.pipe(pug({pretty: true}))
		.pipe(gulp.dest(paths.devDir))
		.pipe(browserSync.stream());
});

// reset css
gulp.task('reset', function(){
	return gulp.src(paths.blocks + '_base/reset.sass')
	.pipe(plumber())
	.pipe(sass().on('error', sass.logError))
	.pipe(prefix({
		browsers: ['last 10 versions'],
		cascade: true
	}))
	.pipe(gulp.dest(paths.devDir + 'css/'))
	.pipe(browserSync.stream());
});

// sass compile
gulp.task('sass', ['reset'], function (){
	return gulp.src(paths.blocks + '*.sass')
		.pipe(plumber())
		.pipe(sass().on('error', sass.logError))
		.pipe(prefix({
			browsers: ['last 10 versions'],
			cascade: true
		}))
		.pipe(gulp.dest(paths.devDir + 'css/'))
		.pipe(browserSync.stream());
});

// js compile
gulp.task('js', function(){
	return gulp.src([
		paths.blocks + '**/*.js',
		'!' + paths.blocks + '_assets/**/*.js'
])
		.pipe(concat('main.js'))
		.pipe(gulp.dest(paths.devDir + 'js/'))
		.pipe(browserSync.stream());
});

// watch
gulp.task('watch', function(){
	gulp.watch(paths.blocks + '**/*.pug', ['pug']);
	gulp.watch(paths.blocks + '**/*.sass', ['sass']);
	gulp.watch(paths.blocks + '**/*.js', ['js']);
});

// server
gulp.task('browser-sync', function(){
	browserSync.init({
		port: 3000,
		server: {
			baseDir: paths.devDir
		}
	});
});

/***************************************
		Production / Билдим и выкладываем
***************************************/

// clean
gulp.task('clean', function(cb){
	rimraf(paths.outputDir, cb);
});

// css + js
gulp.task('build', ['clean'], function () {
	return gulp.src(paths.devDir + '*.html')
		.pipe( useref() )
		.pipe( gulpif('*.js', uglify()) ) 			// в html надо взять в коммент-тег build:js(рядом указав путь и имя файла) - endbuild
		.pipe( gulpif('*.css', cssmin()) )			// тоже только build:css, может быть несколько
		.pipe( gulp.dest(paths.outputDir) );
});

//  images
gulp.task('imgBuild', ['clean'], function() {
	return gulp.src(paths.devDir + 'img/**/*.*')
		.pipe(imagemin())
		.pipe(gulp.dest(paths.outpurDir + 'img/'));
});

// fonts
gulp.task('fontsBuild', ['clean'], function() {
	return gulp.src(paths.devDir + 'fonts/**/*')
		.pipe(gulp.dest(paths.outputDir + 'fonts/'));
});

// ftp
gulp.task('send', function() {

	var connectFtp = ftp.create({
		host: '',
		user: '',
		password: '',
		parallel: 5
	});

	// список для залива
	var globs = [
		'build/**/*',
		"!node_modules/**"
	];

	return gulp.src( globs, { base: '.', buffer: false } )
	.pipe( connectFtp.newer( '/' ) ) // upload newer files
	.pipe( connectFtp.dest( '/' ) )
	.pipe(notify('Dev site updated!'));

});

// default
gulp.task('default', ['browser-sync', 'watch', 'pug', 'sass', 'js']); //запускаем при дефолт-галпе сервер без функции другие таски


 // production
gulp.task('production', ['build', 'imgBuild', 'fontsBuild']); // полная сборка продукта, что бы не загромождать один build
