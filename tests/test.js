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

    it('should set value by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', 'CHANGE!').value(), {a: {b: {c: 'CHANGE!'}}});
        done();
    });

    it('should set value by json path and callback', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', function (O, index) {
            return O + 'CHANGE!';
        }).value(), {a: {b: {c: 'OK!CHANGE!'}}});

        done();
    });

    it('should set null by json path and callback', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', function (O, index) {
            return null;
        }).value(), {a: {b: {c: null}}});

        done();
    });

    it('should set undefined by json path and callback', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', function (O, index) {}).value(), {a: {b: {c: undefined}}});

        done();
    });

    it('should set values by callback in each()' , function (done) {
        var J = jpp({a: {b: {c: [1, 2, 3], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (J, index) {
            return J.value() * 2;
        }).value(), {a: {b: {c: [2, 4, 6], d: 'OK!'}}});
        done();
    });

    it('should skip exception silent in each()' , function (done) {
        var J = jpp({a: {b: {c: ['0', 1, '2', '3'], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (J, index) {
            return J.value().match(/2/) ? J.value() + '!' : '?';
        }).value(), {a: {b: {c: ["?",1,"2!","?"], d: 'OK!'}}});
        done();
    });
});
