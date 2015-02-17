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
          'max-duration': 300,
          browsers: [
            {browserName: 'chrome'},
            {browserName: 'firefox'},
            {browserName: 'safari', version: 7, platform: 'OS X 10.9'},
            {browserName: 'safari', version: 6, platform: 'OS X 10.8'},
            {browserName: 'internet explorer', version: 11, platform: 'Windows 8.1'},
            {browserName: 'internet explorer', version: 10, platform: 'Windows 8'},
            {browserName: 'internet explorer', version: 9, platform: 'Windows 7'},
            {browserName: 'internet explorer', version: 8, platform: 'Windows 7'},
            {browserName: 'internet explorer', version: 7, platform: 'Windows XP'},
            {browserName: 'internet explorer', version: 6, platform: 'Windows XP'},
            {browserName: 'Android', version:'4.4', platform: 'Linux'},
            {browserName: 'Android', version:'4.1', platform: 'Linux'},
            {browserName: 'Android', version:'4.0', platform: 'Linux'},
            {browserName: 'iphone', version:'7.1'},
            {browserName: 'iphone', version:'7.0'},
            {browserName: 'iphone', version:'6.1'},
            {browserName: 'ipad', version:'7.1'},
            {browserName: 'ipad', version:'7.0'},
            {browserName: 'ipad', version:'6.1'}
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.registerTask('default', ['connect:server', 'saucelabs-mocha']);
};
