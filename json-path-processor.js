/*jslint node:true */
'use strict';

var lodash = require('lodash'),
    debug = require('debug')('json-path-processor'),
    jsonpath = function (obj, path, assign, create, del) {
        var P = path ? path.split(/\./).reverse() : [],
            OO = obj,
            O = obj,
            key;

        while (true) {
            key = P.pop();
            switch (key) {
            case '$':
                continue;
            }

            if (!OO) {
                if (create) {
                    OO = {};
                } else {
                    return undefined;
                }
            }

            if (OO[key]) {
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
            if (P.length === 0) {
                break;
            }
        }

        if (del) {
            delete O[key];
            return OO;
        }

        if (assign && key) {
            try {
                O[key] = assign.call ? assign(OO) : assign;
            } catch (E) {
                if (create) {
                    O[key] = create;
                }
            }
        }

        return OO;
    },
    lodash_wrap = function (obj, method, path, cb, elsecb) {
        jsonpath(obj, path, function (O) {
            var T = (typeof O);
            if ((T !== 'object') && (T !== 'array')) {
                return (elsecb && elsecb.call) ? elsecb(O) : undefined;
            }
            return lodash[method](O, function (OO, index, obj) {
                var R;
                try {
                    R = cb(OO, index, obj);
                    if (R !== undefined) {
                        O[index] = R;
                    }
                } catch(E) {
                    debug(E);
                }
            });
        }, elsecb ? true : undefined);
    };

function JPP (data) {
    this._data = data;
}

JPP.prototype = {
    value: function (path) {
        return path ? jsonpath(this._data, path) : this._data;
    },
    get: function (path) {
        return new JPP(this.value(path));
    },
    set: function (path, value, create, del) {
        if (path && path !== '$') {
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
        lodash_wrap(this._data, 'each', path, cb, elsecb);
        return this;
    },
    forIn: function (path, cb, elsecb) {
        lodash_wrap(this._data, 'forIn', path, cb, elsecb);
        return this;
    },
    find: function (path, cb) {
        return lodash.find(this.value(path), cb, this._data);
    },
    findLast: function (path, cb) {
        return lodash.findLast(this.value(path), cb, this._data);
    },
    range: function (path, a1, a2, a3) {
        this.set(path, lodash.range(a1, a2, a3), []);
        return this;
    },
    concat: function () {
        var all = lodash.map(arguments, this.value, this).reduce(function(O, V) {
            return (V && V.concat) ? O.concat(V) : O;
        }, []);

        if (all.length) {
            this.set(arguments[0], all, true);
        }
        return this; 
    }
};

module.exports = function (data) {
    return new JPP(data);
};
