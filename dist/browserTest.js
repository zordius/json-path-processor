(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint node:true */
'use strict';

var jsonpath = function (obj, path, assign, create, del) {
        var P = path ? path.split(/\./).reverse() : [],
            OO = obj ? obj : (create ? {} : null),
            O = obj,
            key;

        if ((OO === null) && !create) {
            return undefined;
        }

        while (P.length) {
            key = P.pop();
            switch (key) {
            case '$':
            case '':
                continue;
            }

            if ((OO[key] !== undefined) && (OO[key] !== null)) {
                OO = OO[key];
            } else {
                if (create !== undefined) {
                    if (P.length) {
                        OO[key] = {};
                    }
                    OO = OO[key];
                } else {
                    return undefined;
                }
            }
            if (P.length === 1) {
                O = OO;
            }
        }

        if (del) {
            if(Array.isArray(O)){
                O.splice(key, 1);
            }else{
                delete O[key];
            }
            return OO;

        }

        if (assign !== undefined) {
            try {
                if (key) {
                    O[key] = assign.call ? assign(OO) : assign;
                } else {
                    O = assign.call ? assign(OO) : assign;
                }
            } catch (E) {
                if (create && key) {
                    if (key) {
                        O[key] = create;
                    }
                }
            }
        }

        return OO;
    };

function JPP (data) {
    this._data = data;
}

JPP.prototype = {
    value: function (path) {
        if (!this._data) { 
            return this._data;
        }
        return path ? jsonpath(this._data, path) : this._data;
    },
    get: function (path) {
        return new JPP(this.value(path));
    },
    set: function (path, value, create, del) {
        if (path && path !== '$') {
            if (create && ((this._data === null) || (typeof this._data !== 'object'))) {
                this._data = {};
            }
            jsonpath(this._data, path, value, create, del);
        } else {
            jsonpath(this, '_data', value, create, del);
        }
        return this;
    },
    copy: function (from, to, skip) {
        return this.set(to, this.value(from), skip ? undefined : null);
    },
    del: function (path) {
        return this.set(path, undefined, false, true);
    },
    move: function (from, to) {
        var V = this.value(from);
        if (V !== undefined) {
            this.set(to, V, true);
            this.del(from);
        }
        return this;
    },
    each: function (path, cb, elsecb) {
        var V = this.value(path);

        if (!V) {
            return elsecb ? this.set(path, elsecb, true) : this;
        }

        if (Array.isArray(V)) {
            return this.set(path, V.map(function (V, I) {
                var R;
                try {
                    R = cb(V, I);
                    return (R === undefined) ? V : R;
                } catch (E) {
                    return V;
                }
            }));
        }

        return this;
    },
    forIn: function (path, cb, elsecb) {
        var V = this.value(path), R ={};

        if (!V) {
            return elsecb ? this.set(path, elsecb, true) : this;
        }

        if ('object' === typeof V) {
            Object.keys(V).map(function (D) {
                try {
                    R[D] = cb(V[D], D);
                } catch (E) {
                    R[D] = V[D];
                }
            });
            return this.set(path, R);
        }

        return this;
    },
    filter: function (path, cb, elsecb) {
        var V = this.value(path), R;

        if (!V) {
            return this.set(path, elsecb);
        }

        if (Array.isArray(V)) {
            return this.set(path, V.filter(function (V, I) {
                var R;
                try {
                    return cb(V, I);
                } catch (E) {
                    return true;
                }
            }));
        }

        if ('object' === typeof V) {
            R = {};
            Object.keys(V).map(function (D) {
                try {
                    if (cb(V[D], D)) {
                        R[D] = V[D];
                    }
                } catch (E) {
                    R[D] = V[D];
                }
            });
            return this.set(path, R);
        }

        return this;
    },
    find: function (path, cb) {
        var V = this.value(path), I;

        if (!V) {
            return;
        }

        for (I in V) {
            try {
                if (cb(V[I])) {
                    return V[I];
                }
            } catch (E) {
                // do nothing
            }
        }
    },
    findLast: function (path, cb) {
        var V = this.value(path), I, R;

        if (!V) {
            return;
        }

        for (I in V) {
            try {
                if (cb(V[I])) {
                    R = V[I];
                }
            } catch (E) {
                // do nothing
            }
        }

        return R;
    },
    range: function (path, a1, a2, a3) {
        var R = [], I, args = [a1];

        if (a2 !== undefined) {
            args.push(a2);
        }

        if (args.length < 2) {
            args.unshift(0);
        }

        if (a3 === undefined) {
            a3 = 1;
        }

        try {
            for (I=args[0];I<args[1];I+=a3) {
                R.push(I);
            }
        } catch (E) {
            // do nothing
        }

        return this.set(path, R, []);
    },
    concat: function () {
        var args = Array.prototype.slice.call(arguments),
            all = [];

        args.map(function (P) {
            var V = this.value(P);

            if (Array.isArray(V)) {
                all = all.concat(V);
            }
        }, this);

        if (all.length) {
            this.set(arguments[0], all, true);
        }

        return this; 
    }
};

module.exports = function (data, path) {
    return path ? jsonpath(data, path) : (new JPP(data));
};

},{}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":6}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
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

},{"../json-path-processor":1,"assert":2}]},{},[7]);
