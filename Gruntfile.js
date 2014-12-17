module.exports = function (grunt) {
  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: '.',
          hostname: '*',
          port: 9999
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          build: process.env.TRAVIS_JOB_ID,
          urls: ['http://localhost:9999/test/'],
          testname: 'Mocha Unit Test for JPP',
          sauceConfig: {
              tags: [process.env.TRAVIS_JOB_ID, process.env.TRAVIS_COMMIT, 'jpp', 'mocha'],
              public: 'public'
          },
          detailedError: true,
          concurrency: 2,
          maxPollRetries: 3,
          'max-duration': 60,
          browsers: [
            {browserName: 'chrome'},
            {browserName: 'firefox'},
            {browserName: 'safari', version: 7, platform: 'OS X 10.9'},
            {browserName: 'safari', version: 6, platform: 'OS X 10.8'},
            {browserName: 'internet explorer', version: 11, platform: 'Windows 8.1'},
            {browserName: 'internet explorer', version: 10, platform: 'Windows 8'},
            {browserName: 'internet explorer', version: 9, platform: 'Windows 7'},
            {browserName: 'iphone', version:'7.1', platform: 'OS X 10.9'},
            {browserName: 'iphone', version:'7.0', platform: 'OS X 10.9'},
            {browserName: 'iphone', version:'6.1', platform: 'OS X 10.8'},
            {browserName: 'ipad', version:'7.1', platform: 'OS X 10.9'},
            {browserName: 'ipad', version:'7.0', platform: 'OS X 10.9'},
            {browserName: 'ipad', version:'6.1', platform: 'OS X 10.8'}
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.registerTask('default', ['connect:server', 'saucelabs-mocha']);
};
