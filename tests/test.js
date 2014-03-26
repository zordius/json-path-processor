/*jslint indent:4, nomen:true, white:true, node:true */
/*global describe, it */

'use strict';

var assert = require('assert'),
    debug = require('debug')('tests'),
    ecconf = require('../json-path-processor');

describe('json-path-processor', function () {
    it('should can run', function (done) {
        assert.equal(typeof conf, 'object'); 
        debug('test 5 config' + JSON.stringify(conf));
        done();
    });
});
