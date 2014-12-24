'use strict';

var assert = require('assert'),
    jpp = require('../json-path-processor');

describe('json-path-processor', function () {
    it('should be a fast return value function', function (done) {
        assert.equal(3, jpp({a: {b: {c: 3}}}, 'a.b.c'));
        done();
    });

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

    it('should get value by dot notation', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.equal(J.value('a.b.c'), 'OK!');
        done();
    });

    it('should get undefined when not found', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.equal(J.value('a.b.d'), undefined);
        done();
    });

    it('should safe when input is undefined', function (done) {
        assert.equal(jpp(undefined).value('a.b.d'), undefined);
        done();
    });

    it('should safe when input is null', function (done) {
        assert.equal(jpp(null).value('a.b.d'), null);
        done();
    });

    it('should set value by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', 'CHANGE!').value(), {a: {b: {c: 'CHANGE!'}}});
        done();
    });

    it('should set to 0 by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', 0).value(), {a: {b: {c: 0}}});
        done();
    });

    it('should set to empty string by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', '').value(), {a: {b: {c: ''}}});
        done();
    });

    it('should set to empty array by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', []).value(), {a: {b: {c: []}}});
        done();
    });

    it('should set self by json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.equal(J.set('$', '?!').value(), '?!');
        done();
    });

    it('should set self by empty json path', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.equal(J.set('', '?!').value(), '?!');
        done();
    });

    it('should create new children by json path when not exists', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('a.d.e', '?!', true).value(), {a: {b: {c: 'OK!'}, d: {e: '?!'}}});
        done();
    });

    it('should create new object when input is undefined', function (done) {
        assert.deepEqual(jpp().set('a.d.e', '?!', true).value(), {a: {d: {e: '?!'}}});
        done();
    });

    it('should create new object when input is null', function (done) {
        assert.deepEqual(jpp(null).set('a.d.e', '?!', true).value(), {a: {d: {e: '?!'}}});
        done();
    });

    it('should create new object when input is 0', function (done) {
        assert.deepEqual(jpp(0).set('a.d.e', '?!', true).value(), {a: {d: {e: '?!'}}});
        done();
    });

    it('should create new object when input is 1', function (done) {
        assert.deepEqual(jpp(1).set('a.d.e', '?!', true).value(), {a: {d: {e: '?!'}}});
        done();
    });

    it('should create new children by json path and set default value when exception', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('a.d.e', function () {return [].match(/123/);}, {ok: 'Y!'}).value(), {"a":{"b":{"c":"OK!"},"d":{"e":{"ok":"Y!"}}}});
        done();
    });

    it('should set value by json path and callback', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.set('$.a.b.c', function (O, index) {
            return O + 'CHANGE!';
        }).value(), {a: {b: {c: 'OK!CHANGE!'}}});

        done();
    });

    it('should be ok when set on null', function (done) {
        assert.deepEqual(null, jpp(null).set('a.b', 1).value());
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

    it('should delete the key', function (done) {
        var J = jpp({a: {b: {c: 'OK!', d: 'Error'}}});

        assert.deepEqual(J.del('a.b.c').value(), {"a":{"b":{"d":"Error"}}});
        assert.deepEqual(J.del('a.b.d').value(), {"a":{"b":{}}});

        done();
    });

    it('should delete an item from the array', function (done) {
        var J = jpp({a: {b: {c: [1, 3, 5, 7, 9, 10], d: 'Error'}}});

        assert.deepEqual(J.del('a.b.c.3').value(), {"a":{"b":{"c":[1,3,5,9,10],"d":"Error"}}});
        assert.deepEqual(J.del('a.b.c.4').value(), {"a":{"b":{"c":[1,3,5,9],"d":"Error"}}});

        done();
    });

    it('should change key from a to b', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.move('a.b.c', 'a.r.q').value(), {"a":{"b":{},"r":{"q":"OK!"}}});

        done();
    });

    it('should copy value from a to b', function (done) {
        var J = jpp({a: {b: {c: 'OK!'}}});

        assert.deepEqual(J.copy('a.b.c', 'a.r.q').value(), {"a":{"b":{c: 'OK!'},"r":{"q":"OK!"}}});

        done();
    });

    it('should set values by callback in each()' , function (done) {
        var J = jpp({a: {b: {c: [1, 2, 3], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (O, index) {
            return O * 2;
        }).value(), {a: {b: {c: [2, 4, 6], d: 'OK!'}}});
        done();
    });

    it('should not change when no return value in each()', function (done) {
        var J = jpp({a: {b: {c: [1, 2, 3, 4], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (O, index) {
            return (O % 2) ? O * 2 : undefined;
        }).value(), {a: {b: {c: [2, 2, 6, 4], d: 'OK!'}}});
        done();
    });

    it('should know index in callback from 2nd argument in each()', function (done) {
        var J = jpp({a: {b: {c: [1, 2, 3], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (O, index) {
            return O * index;
        }).value(), {a: {b: {c: [0, 2, 6], d: 'OK!'}}});
        done();
    });

    it('should skip exception silent in each()' , function (done) {
        var J = jpp({a: {b: {c: ['0', 1, '2', '3'], d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (O, index) {
            return O.match(/2/) ? O + '!' : '?';
        }).value(), {a: {b: {c: ["?",1,"2!","?"], d: 'OK!'}}});
        done();
    });

    it('should only work on array when each()' , function (done) {
        var J = jpp({a: {b: {c: {0: 0, 1: 1, 2: 2, length: 4}, d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.c', function (O, index) {
            return O + '!';
        }).value(), {a:{b:{c:{0: 0, 1: 1, 2: 2, length: 4},d:'OK!'}}});
        done();
    });

    it('should call elsecb when path not found in each()', function (done) {
        var J = jpp({a: {b: {c: {0: 0, 1: 1, 2: 2, length: 4}, d: 'OK!'}}});

        assert.deepEqual(J.each('a.b.e', function (O, index) {
            return O + '!';
        }, function (O) {
            return (O == undefined) ? 'UNDEFINED' : O;
        }).value(), {a:{b:{c:{0:0, 1:1, 2:2 ,length:4},d:'OK!', e:'UNDEFINED'}}});
        done();
    });

    it('should work great when path to self in each()', function (done) {
        var J = jpp({a: {b: {c: [2, 4, 9]}}});

        assert.deepEqual(J.get('a.b.c').each('', function (O, index) {
            return O + '!';
        }).value(), ['2!', '4!', '9!']);
        done();
    });

    it('should be safe when input null then .each()' , function (done) {
        assert.deepEqual(jpp(null).each('a.b.c', function (O, index) {
        }).value(), null);
        done();
    });

    it('should be safe when input undefined then .each()' , function (done) {
        assert.deepEqual(jpp().each('a.b.c', function (O, index) {
        }).value(), undefined);
        done();
    });

    it('should be safe when input 0 then .each()' , function (done) {
        assert.deepEqual(jpp(0).each('a.b.c', function (O, index) {
        }).value(), 0);
        done();
    });

    it('should each properties when length property exists in forIn()' , function (done) {
        var J = jpp({a: {b: {c: {0: 0, 1: 1, 2: 2, length: 4}, d: 'OK!'}}});

        assert.deepEqual(J.forIn('a.b.c', function (O, index) {
            return O + '!';
        }).value(), {a:{b:{c:{0:'0!',1:'1!',2:'2!',length:'4!'},d:'OK!'}}});
        done();
    });

    it('should concat all arraies into one', function (done) {
        var J = jpp({a: {b: {c: [1, 3], d: 5}}});

        assert.deepEqual(J.concat('a.d', 'a.b.c', 'a.b.c').value(), {a: {b: {c: [1, 3], d:5}, d: [1, 3, 1,3]}});
        done();
    });

    it('should create range by count', function (done) {
        var J = jpp({a: {b: {c: [1, 3], d: 5}}});

        assert.deepEqual(J.range('a.d', 4).value(), {a: {b: {c: [1, 3], d:5}, d: [0,1,2,3]}});
        done();
    });

    it('should create range by start and end', function (done) {
        var J = jpp({a: {b: {c: [1, 3], d: 5}}});

        assert.deepEqual(J.range('a.d', 2, 5).value(), {a: {b: {c: [1, 3], d:5}, d: [2,3,4]}});
        done();
    });

    it('should create range by start and end and steps', function (done) {
        var J = jpp({a: {b: {c: [1, 3], d: 5}}});

        assert.deepEqual(J.range('a.d', 2, 13, 3).value(), {a: {b: {c: [1, 3], d:5}, d: [2,5,8,11]}});
        done();
    });

    it('should find first object by callback', function (done) {
        var J = jpp({a: {b: {c: [2, 3, 4, 5], d: 5}}});

        assert.deepEqual(J.find('a.b.c', function (O) {
            return O % 2 > 0;
        }), 3);
        done();
    });

    it('should find last object by callback', function (done) {
        var J = jpp({a: {b: {c: [2, 3, 4, 5], d: 5}}});

        assert.deepEqual(J.findLast('a.b.c', function (O) {
            return O % 2 > 0;
        }), 5);
        done();
    });

    it('should be filtered by even', function (done) {
        var J = jpp({a: {b: {c: [2, 3, 4, 5], d: 5}}});

        assert.deepEqual(J.filter('a.b.c', function (O) {
            return O % 2 > 0;
        }).value(), {a: {b: {c: [3, 5], d:5}}});
        done();
    });

    it('should return 0', function (done) {
        assert.equal(0, jpp({a: {b: {c: 0}}}, 'a.b.c'));
        done();
    });

    it('should return empty string', function (done) {
        assert.equal("", jpp({a: {b: {c: ""}}}, 'a.b.c'));
        done();
    });
});
