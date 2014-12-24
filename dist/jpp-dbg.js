!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.JsonPathProcessor=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc29uLXBhdGgtcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzbGludCBub2RlOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGpzb25wYXRoID0gZnVuY3Rpb24gKG9iaiwgcGF0aCwgYXNzaWduLCBjcmVhdGUsIGRlbCkge1xuICAgICAgICB2YXIgUCA9IHBhdGggPyBwYXRoLnNwbGl0KC9cXC4vKS5yZXZlcnNlKCkgOiBbXSxcbiAgICAgICAgICAgIE9PID0gb2JqID8gb2JqIDogKGNyZWF0ZSA/IHt9IDogbnVsbCksXG4gICAgICAgICAgICBPID0gb2JqLFxuICAgICAgICAgICAga2V5O1xuXG4gICAgICAgIGlmICgoT08gPT09IG51bGwpICYmICFjcmVhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoUC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGtleSA9IFAucG9wKCk7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgY2FzZSAnJCc6XG4gICAgICAgICAgICBjYXNlICcnOlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoKE9PW2tleV0gIT09IHVuZGVmaW5lZCkgJiYgKE9PW2tleV0gIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgT08gPSBPT1trZXldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFAubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPT1trZXldID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgT08gPSBPT1trZXldO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFAubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgTyA9IE9PO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlbCkge1xuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShPKSl7XG4gICAgICAgICAgICAgICAgTy5zcGxpY2Uoa2V5LCAxKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBPW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT087XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NpZ24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIE9ba2V5XSA9IGFzc2lnbi5jYWxsID8gYXNzaWduKE9PKSA6IGFzc2lnbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBPID0gYXNzaWduLmNhbGwgPyBhc3NpZ24oT08pIDogYXNzaWduO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKEUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRlICYmIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPW2tleV0gPSBjcmVhdGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gT087XG4gICAgfTtcblxuZnVuY3Rpb24gSlBQIChkYXRhKSB7XG4gICAgdGhpcy5fZGF0YSA9IGRhdGE7XG59XG5cbkpQUC5wcm90b3R5cGUgPSB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGlmICghdGhpcy5fZGF0YSkgeyBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoID8ganNvbnBhdGgodGhpcy5fZGF0YSwgcGF0aCkgOiB0aGlzLl9kYXRhO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IEpQUCh0aGlzLnZhbHVlKHBhdGgpKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlLCBjcmVhdGUsIGRlbCkge1xuICAgICAgICBpZiAocGF0aCAmJiBwYXRoICE9PSAnJCcpIHtcbiAgICAgICAgICAgIGlmIChjcmVhdGUgJiYgKCh0aGlzLl9kYXRhID09PSBudWxsKSB8fCAodHlwZW9mIHRoaXMuX2RhdGEgIT09ICdvYmplY3QnKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqc29ucGF0aCh0aGlzLl9kYXRhLCBwYXRoLCB2YWx1ZSwgY3JlYXRlLCBkZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAganNvbnBhdGgodGhpcywgJ19kYXRhJywgdmFsdWUsIGNyZWF0ZSwgZGVsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGNvcHk6IGZ1bmN0aW9uIChmcm9tLCB0bywgc2tpcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXQodG8sIHRoaXMudmFsdWUoZnJvbSksIHNraXAgPyB1bmRlZmluZWQgOiBudWxsKTtcbiAgICB9LFxuICAgIGRlbDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIHVuZGVmaW5lZCwgZmFsc2UsIHRydWUpO1xuICAgIH0sXG4gICAgbW92ZTogZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShmcm9tKTtcbiAgICAgICAgaWYgKFYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXQodG8sIFYsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5kZWwoZnJvbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBlYWNoOiBmdW5jdGlvbiAocGF0aCwgY2IsIGVsc2VjYikge1xuICAgICAgICB2YXIgViA9IHRoaXMudmFsdWUocGF0aCk7XG5cbiAgICAgICAgaWYgKCFWKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxzZWNiID8gdGhpcy5zZXQocGF0aCwgZWxzZWNiLCB0cnVlKSA6IHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShWKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIFYubWFwKGZ1bmN0aW9uIChWLCBJKSB7XG4gICAgICAgICAgICAgICAgdmFyIFI7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgUiA9IGNiKFYsIEkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFIgPT09IHVuZGVmaW5lZCkgPyBWIDogUjtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBWO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZm9ySW46IGZ1bmN0aW9uIChwYXRoLCBjYiwgZWxzZWNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgUiA9e307XG5cbiAgICAgICAgaWYgKCFWKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxzZWNiID8gdGhpcy5zZXQocGF0aCwgZWxzZWNiLCB0cnVlKSA6IHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJ29iamVjdCcgPT09IHR5cGVvZiBWKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhWKS5tYXAoZnVuY3Rpb24gKEQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBSW0RdID0gY2IoVltEXSwgRCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICBSW0RdID0gVltEXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCBSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZmlsdGVyOiBmdW5jdGlvbiAocGF0aCwgY2IsIGVsc2VjYikge1xuICAgICAgICB2YXIgViA9IHRoaXMudmFsdWUocGF0aCksIFI7XG5cbiAgICAgICAgaWYgKCFWKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgZWxzZWNiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KFYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgVi5maWx0ZXIoZnVuY3Rpb24gKFYsIEkpIHtcbiAgICAgICAgICAgICAgICB2YXIgUjtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoViwgSSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJ29iamVjdCcgPT09IHR5cGVvZiBWKSB7XG4gICAgICAgICAgICBSID0ge307XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhWKS5tYXAoZnVuY3Rpb24gKEQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IoVltEXSwgRCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJbRF0gPSBWW0RdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICBSW0RdID0gVltEXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCBSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZmluZDogZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgSTtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoSSBpbiBWKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChjYihWW0ldKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVltJXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBmaW5kTGFzdDogZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgSSwgUjtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoSSBpbiBWKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChjYihWW0ldKSkge1xuICAgICAgICAgICAgICAgICAgICBSID0gVltJXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFI7XG4gICAgfSxcbiAgICByYW5nZTogZnVuY3Rpb24gKHBhdGgsIGExLCBhMiwgYTMpIHtcbiAgICAgICAgdmFyIFIgPSBbXSwgSSwgYXJncyA9IFthMV07XG5cbiAgICAgICAgaWYgKGEyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChhMik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICBhcmdzLnVuc2hpZnQoMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYTMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYTMgPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoST1hcmdzWzBdO0k8YXJnc1sxXTtJKz1hMykge1xuICAgICAgICAgICAgICAgIFIucHVzaChJKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIFIsIFtdKTtcbiAgICB9LFxuICAgIGNvbmNhdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBhbGwgPSBbXTtcblxuICAgICAgICBhcmdzLm1hcChmdW5jdGlvbiAoUCkge1xuICAgICAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKFApO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShWKSkge1xuICAgICAgICAgICAgICAgIGFsbCA9IGFsbC5jb25jYXQoVik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmIChhbGwubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnNldChhcmd1bWVudHNbMF0sIGFsbCwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpczsgXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZGF0YSwgcGF0aCkge1xuICAgIHJldHVybiBwYXRoID8ganNvbnBhdGgoZGF0YSwgcGF0aCkgOiAobmV3IEpQUChkYXRhKSk7XG59O1xuIl19
