require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1]);
