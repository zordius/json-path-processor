const customLaunchers = {
  slab_chrome:  {browserName: 'chrome', base: 'SauceLabs'},
  slab_firefox: {browserName: 'firefox', base: 'SauceLabs'},
  slab_safari7:  {browserName: 'safari', base: 'SauceLabs', version: 7, platform: 'OS X 10.9'},
  slab_safari6:  {browserName: 'safari', base: 'SauceLabs', version: 6, platform: 'OS X 10.8'},
  slab_ie11:     {browserName: 'internet explorer', base: 'SauceLabs', version: 11, platform: 'Windows 8.1'},
  slab_ie10:     {browserName: 'internet explorer', base: 'SauceLabs', version: 10, platform: 'Windows 8'},
  slab_ie9:      {browserName: 'internet explorer', base: 'SauceLabs', version: 9, platform: 'Windows 7'},
  slab_android60:{browserName: 'Browser', base: 'SauceLabs', version: '6.0', platform: 'Android', device: 'Android Emulator'},
  slab_android51:{browserName: 'Browser', base: 'SauceLabs', version: '5.1', platform: 'Android', device: 'Android Emulator'},
  slab_android44:{browserName: 'Browser', base: 'SauceLabs', version: '4.4', platform: 'Android', device: 'Android Emulator'},
  slab_iphone103: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPhone Simulator', platform: 'iOS', version:'10.3'},
  slab_iphone93: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPhone Simulator', platform: 'iOS', version:'9.3'},
  slab_iphone84: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPhone Simulator', platformName: 'iOS', platformVersion:'8.4'},
  slab_iphone81: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPhone Simulator', platformName: 'iOS', platformVersion:'8.1'},
  slab_ipad103: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPad Simulator', platformName: 'iOS', platformVersion:'10.3'},
  slab_ipad93: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPad Simulator', platformName: 'iOS', platformVersion:'9.3'},
  slab_ipad84: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPad Simulator', platformName: 'iOS', platformVersion:'8.4'},
  slab_ipad81: {browserName: 'Safari', base: 'SauceLabs', deviceName: 'iPad Simulator', platformName: 'iOS', platformVersion:'8.1'}
}

module.exports = cfg => {
  cfg.set({
    sauceLabs: {
      testName: 'Mocha Unit Test for JPP',
      public: 'public',
      tags: [process.env.TRAVIS_JOB_ID, process.env.TRAVIS_COMMIT, 'jpp', 'mocha', 'karma'],
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      connectOptions: {
        port: 4446
      },
      connectLocationForSERelay: 'localhost',
      connectPortForSERelay: '4446'
    },
    logLevel: cfg.LOG_DEBUG,
    customLaunchers,
    browsers: Object.keys(customLaunchers),
    frameworks: ['mocha', 'browserify'],
    files: ['test/*.js'],
    preprocessors: {
      'test/*.js': ['browserify']
    },
    captureTimeout: 180000,
    singleRun: true,
    concurrency: 2,
    reporters: ['dots', 'saucelabs']
  })
}
