/*jslint indent:4, nomen:true, white:true, node:true */
/*global describe, it */

'use strict';

var assert = require('assert'),
    debug = require('debug')('tests'),
    jpp = require('../json-path-processor');

describe('json-path-processor', function () {
    it('should be an object', function (done) {
        var J = jpp([1, 2, 3]);
        assert.equal(typeof J, 'object'); 
        done();
    });

    it('should be jpp object', function (done) {
        var J = jpp([1, 2, 3]);
        assert.deepEqual(J.value(), [1, 2, 3]);
        done(); 
    });

    it('should get value by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.equal(J.value('$.a.b.c'), 'OK!');
        done();
    });
});
