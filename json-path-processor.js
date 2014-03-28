/*jslint node:true */
'use strict';

var lodash = require('lodash'),
    debug = require('debug')('json-path-processor'),
    jsonpath = function (obj, path, assign) {
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
                return null;
            }
            if (P.length === 1) {
                O = OO;
            }
            if (P.length === 0) {
                break;
            }
        }

        if (assign && key) {
            O[key] = assign.call ? assign(OO) : assign;
        }

        return OO;
    },
    lodash_wrap = function (obj, method, path, cb) {
        jsonpath(obj, path, function (O) {
            return lodash[method](O, function (OO, index, obj) {
                try {
                    O[index] = cb(OO, index, obj);
                } catch(E) {
                    debug(E);
                }
            });
        });
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
    set: function (path, value) {
        jsonpath(this._data, path, value);
        return this;
    },
    each: function (path, cb) {
        lodash_wrap(this._data, 'each', path, cb);
        return this;
    },
    forIn: function (path, cb) {
        lodash_wrap(this._data, 'forIn', path, cb);
        return this;
    }
};

module.exports = function (data) {
    return new JPP(data);
};
