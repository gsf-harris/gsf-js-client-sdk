// Karma configuration
// Generated on Thu Jan 26 2017 12:28:54 GMT-0700 (Mountain Standard Time)
var webpackConfig = require('./webpack.config.js');

// Use inline source map for tests.
webpackConfig.devtool = 'inline-source-map';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    client: {
      mocha: config.grep ? {grep: config.grep} : {}
    },

    // list of files / patterns to load in the browser
    files: [
      'test/**/*.test.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // add webpack as preprocessor
      'test/**/*.test.js': ['webpack', 'sourcemap']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    browserNoActivityTimeout: 35000,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Custom browser launchers
    customLaunchers: {
      phantomJSWithoutSecurity: {
        base: 'PhantomJS',
        options: {
          settings: {
            webSecurityEnabled: false
          }
        },
        debug: true
      },
      chromeWithoutSecurity: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      },
      firefoxWithoutSecurity: {
        base: 'Firefox'
      }
    },

    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: webpackConfig,
    webpackServer: {
      noInfo: false
    }
  });
};