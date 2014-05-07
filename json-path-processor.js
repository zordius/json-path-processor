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
            if (OO[key]) {
                OO = OO[key];
            } else {
                if (create) {
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
                try {
                    O[index] = cb(OO, index, obj);
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
    }
};

module.exports = function (data) {
    return new JPP(data);
};
