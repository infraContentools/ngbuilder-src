'use strict';

/**
 * - read all the source files
 * - concat in one file
 * - transform ES6 syntax
 * - add AngularJS annotations
 * - write to modulePath/index.js
 */

module.exports = (function() {
	var vinyl, multipipe, concat, traceur, ngAnnotate, wrap, jshint, template, nodePath, _initialized;

	function init() {
		if (_initialized) return;

		vinyl = require('vinyl-fs');
		multipipe = require('multipipe');
		concat = require('gulp-concat');
		traceur = require('gulp-traceur');
		ngAnnotate = require('gulp-ng-annotate');
		wrap = require('gulp-wrap');
		template = require('gulp-template');
		jshint = require('gulp-jshint');
		nodePath = require('path');

		_initialized = true;
	}

	function run(context, options, next) {
		init();

		var modulePath = context.modulePath,
			sources = ['/src/module.js', '/src/**/*.js'];

		if (options.append) {
			sources = sources.concat(options.append);
		}

		sources = sources.map(function(path) {
			return nodePath.join(modulePath, path);
		});

		var pipe = multipipe(
			vinyl.src(sources),
			jshint(),
			jshint.reporter('jshint-stylish'),
			jshint.reporter('fail'),
			concat('index.js'),
			traceur(traceurOptions),
			ngAnnotate(ngAnnotateOptions),
			wrap(wrapOptions),
			template(context)
		);

		function done(err) {
			pipe.removeListener('error', done);
			pipe.removeListener('end', done);
			next(err);
		}

		pipe.on('error', done);
		pipe.on('end', done);

		pipe.pipe(vinyl.dest(modulePath));
	}

	return {
		name: 'src',
		watcher: 'src/**/*.js',
		run: run
	};
})();

var traceurOptions = {
	sourceMaps: false,
	modules: 'commonjs'
};

var ngAnnotateOptions = {
	add: true,
	single_quotes: true
};

var wrapOptions = '(function() {\n<%= contents %>\nif(typeof $module !== \'undefined\') {module.exports = $module;} })();';