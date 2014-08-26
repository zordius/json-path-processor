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
          detailedError: true,
          concurrency: 2,
          'max-duration': 30,
          browsers: [
            {browserName: 'chrome'},
            {browserName: 'firefox'},
            {browserName: 'safari', version: 7, platform: 'OS X 10.9'},
            {browserName: 'safari', version: 6, platform: 'OS X 10.8'},
            {browserName: 'internet explorer', version: 11, platform: 'Windows 8.1'},
            {browserName: 'internet explorer', version: 10, platform: 'Windows 8'},
            {browserName: 'internet explorer', version: 9, platform: 'Windows 7'}
          ]
        }
      }
    },
    shell: {
      build: {
        command: 'npm run-script build_std && npm run-script build_dbg && npm run-script build_min && npm run-script build_req && npm run-script build_tst'
      },
      lint: {
        command: 'npm run-script lint'
      },
      test: {
        command: 'npm test'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['shell:lint', 'shell:build', 'shell:test', 'connect:server', 'saucelabs-mocha']);
};
