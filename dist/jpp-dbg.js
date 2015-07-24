(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.JsonPathProcessor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint node: true */
'use strict';

var parsePath = function (path) {
    var R = [];

    if (!path) {
        return [];
    }

    if (!path.match) {
        return [path];
    }

    if (!path.match(/\[|\]/)) {
        return path.split(/\./).reverse();
    }

    if (!('.' + path).replace(/\.([^\.\[]*)|\[\'([^\]]+)\'\]/g, function (M, D, A) {
        R.push((D === undefined) ? A : D);
        return '';
    }) === '') {
        // FIXEME: syntax error, do nothing now
    }

    return R.reverse();
};

var jsonpath = function (obj, path, assign, create, del) {
        var P = parsePath(path),
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
            return elsecb ? this.set(path, elsecb, true) : this;
        }

        if (Array.isArray(V)) {
            return this.set(path, V.filter(function (V, I) {
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

module.exports.parsePath = parsePath;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc29uLXBhdGgtcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGFyc2VQYXRoID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICB2YXIgUiA9IFtdO1xuXG4gICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBpZiAoIXBhdGgubWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIFtwYXRoXTtcbiAgICB9XG5cbiAgICBpZiAoIXBhdGgubWF0Y2goL1xcW3xcXF0vKSkge1xuICAgICAgICByZXR1cm4gcGF0aC5zcGxpdCgvXFwuLykucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIGlmICghKCcuJyArIHBhdGgpLnJlcGxhY2UoL1xcLihbXlxcLlxcW10qKXxcXFtcXCcoW15cXF1dKylcXCdcXF0vZywgZnVuY3Rpb24gKE0sIEQsIEEpIHtcbiAgICAgICAgUi5wdXNoKChEID09PSB1bmRlZmluZWQpID8gQSA6IEQpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSkgPT09ICcnKSB7XG4gICAgICAgIC8vIEZJWEVNRTogc3ludGF4IGVycm9yLCBkbyBub3RoaW5nIG5vd1xuICAgIH1cblxuICAgIHJldHVybiBSLnJldmVyc2UoKTtcbn07XG5cbnZhciBqc29ucGF0aCA9IGZ1bmN0aW9uIChvYmosIHBhdGgsIGFzc2lnbiwgY3JlYXRlLCBkZWwpIHtcbiAgICAgICAgdmFyIFAgPSBwYXJzZVBhdGgocGF0aCksXG4gICAgICAgICAgICBPTyA9IG9iaiA/IG9iaiA6IChjcmVhdGUgPyB7fSA6IG51bGwpLFxuICAgICAgICAgICAgTyA9IG9iaixcbiAgICAgICAgICAgIGtleTtcblxuICAgICAgICBpZiAoKE9PID09PSBudWxsKSAmJiAhY3JlYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKFAubGVuZ3RoKSB7XG4gICAgICAgICAgICBrZXkgPSBQLnBvcCgpO1xuICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgIGNhc2UgJyQnOlxuICAgICAgICAgICAgY2FzZSAnJzpcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChPT1trZXldICE9PSB1bmRlZmluZWQpICYmIChPT1trZXldICE9PSBudWxsKSkge1xuICAgICAgICAgICAgICAgIE9PID0gT09ba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChQLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT09ba2V5XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIE9PID0gT09ba2V5XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChQLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIE8gPSBPTztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZWwpIHtcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoTykpe1xuICAgICAgICAgICAgICAgIE8uc3BsaWNlKGtleSwgMSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBkZWxldGUgT1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9PO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXNzaWduICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBPW2tleV0gPSBhc3NpZ24uY2FsbCA/IGFzc2lnbihPTykgOiBhc3NpZ247XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgTyA9IGFzc2lnbi5jYWxsID8gYXNzaWduKE9PKSA6IGFzc2lnbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZSAmJiBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT1trZXldID0gY3JlYXRlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE9PO1xuICAgIH07XG5cbmZ1bmN0aW9uIEpQUCAoZGF0YSkge1xuICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xufVxuXG5KUFAucHJvdG90eXBlID0ge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICBpZiAoIXRoaXMuX2RhdGEpIHsgXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aCA/IGpzb25wYXRoKHRoaXMuX2RhdGEsIHBhdGgpIDogdGhpcy5fZGF0YTtcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBKUFAodGhpcy52YWx1ZShwYXRoKSk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSwgY3JlYXRlLCBkZWwpIHtcbiAgICAgICAgaWYgKHBhdGggJiYgcGF0aCAhPT0gJyQnKSB7XG4gICAgICAgICAgICBpZiAoY3JlYXRlICYmICgodGhpcy5fZGF0YSA9PT0gbnVsbCkgfHwgKHR5cGVvZiB0aGlzLl9kYXRhICE9PSAnb2JqZWN0JykpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAganNvbnBhdGgodGhpcy5fZGF0YSwgcGF0aCwgdmFsdWUsIGNyZWF0ZSwgZGVsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpzb25wYXRoKHRoaXMsICdfZGF0YScsIHZhbHVlLCBjcmVhdGUsIGRlbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBjb3B5OiBmdW5jdGlvbiAoZnJvbSwgdG8sIHNraXApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHRvLCB0aGlzLnZhbHVlKGZyb20pLCBza2lwID8gdW5kZWZpbmVkIDogbnVsbCk7XG4gICAgfSxcbiAgICBkZWw6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCB1bmRlZmluZWQsIGZhbHNlLCB0cnVlKTtcbiAgICB9LFxuICAgIG1vdmU6IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICB2YXIgViA9IHRoaXMudmFsdWUoZnJvbSk7XG4gICAgICAgIGlmIChWICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KHRvLCBWLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuZGVsKGZyb20pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZWFjaDogZnVuY3Rpb24gKHBhdGgsIGNiLCBlbHNlY2IpIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKHBhdGgpO1xuXG4gICAgICAgIGlmICghVikge1xuICAgICAgICAgICAgcmV0dXJuIGVsc2VjYiA/IHRoaXMuc2V0KHBhdGgsIGVsc2VjYiwgdHJ1ZSkgOiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoVikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCBWLm1hcChmdW5jdGlvbiAoViwgSSkge1xuICAgICAgICAgICAgICAgIHZhciBSO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIFIgPSBjYihWLCBJKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChSID09PSB1bmRlZmluZWQpID8gViA6IFI7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGZvckluOiBmdW5jdGlvbiAocGF0aCwgY2IsIGVsc2VjYikge1xuICAgICAgICB2YXIgViA9IHRoaXMudmFsdWUocGF0aCksIFIgPXt9O1xuXG4gICAgICAgIGlmICghVikge1xuICAgICAgICAgICAgcmV0dXJuIGVsc2VjYiA/IHRoaXMuc2V0KHBhdGgsIGVsc2VjYiwgdHJ1ZSkgOiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdvYmplY3QnID09PSB0eXBlb2YgVikge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoVikubWFwKGZ1bmN0aW9uIChEKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgUltEXSA9IGNiKFZbRF0sIEQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKEUpIHtcbiAgICAgICAgICAgICAgICAgICAgUltEXSA9IFZbRF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgUik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGZpbHRlcjogZnVuY3Rpb24gKHBhdGgsIGNiLCBlbHNlY2IpIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKHBhdGgpLCBSO1xuXG4gICAgICAgIGlmICghVikge1xuICAgICAgICAgICAgcmV0dXJuIGVsc2VjYiA/IHRoaXMuc2V0KHBhdGgsIGVsc2VjYiwgdHJ1ZSkgOiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoVikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCBWLmZpbHRlcihmdW5jdGlvbiAoViwgSSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYihWLCBJKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgnb2JqZWN0JyA9PT0gdHlwZW9mIFYpIHtcbiAgICAgICAgICAgIFIgPSB7fTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKFYpLm1hcChmdW5jdGlvbiAoRCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYihWW0RdLCBEKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgUltEXSA9IFZbRF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgICAgIFJbRF0gPSBWW0RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIFIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBmaW5kOiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKHBhdGgpLCBJO1xuXG4gICAgICAgIGlmICghVikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChJIGluIFYpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKFZbSV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBWW0ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKEUpIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGZpbmRMYXN0OiBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKHBhdGgpLCBJLCBSO1xuXG4gICAgICAgIGlmICghVikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChJIGluIFYpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKFZbSV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIFIgPSBWW0ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKEUpIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUjtcbiAgICB9LFxuICAgIHJhbmdlOiBmdW5jdGlvbiAocGF0aCwgYTEsIGEyLCBhMykge1xuICAgICAgICB2YXIgUiA9IFtdLCBJLCBhcmdzID0gW2ExXTtcblxuICAgICAgICBpZiAoYTIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKGEyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIGFyZ3MudW5zaGlmdCgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhMyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhMyA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yIChJPWFyZ3NbMF07STxhcmdzWzFdO0krPWEzKSB7XG4gICAgICAgICAgICAgICAgUi5wdXNoKEkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgUiwgW10pO1xuICAgIH0sXG4gICAgY29uY2F0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIGFsbCA9IFtdO1xuXG4gICAgICAgIGFyZ3MubWFwKGZ1bmN0aW9uIChQKSB7XG4gICAgICAgICAgICB2YXIgViA9IHRoaXMudmFsdWUoUCk7XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KFYpKSB7XG4gICAgICAgICAgICAgICAgYWxsID0gYWxsLmNvbmNhdChWKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKGFsbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KGFyZ3VtZW50c1swXSwgYWxsLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzOyBcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkYXRhLCBwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGggPyBqc29ucGF0aChkYXRhLCBwYXRoKSA6IChuZXcgSlBQKGRhdGEpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLnBhcnNlUGF0aCA9IHBhcnNlUGF0aDtcbiJdfQ==
