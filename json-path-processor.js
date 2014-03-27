/*jslint node:true */
'use strict';

var ld = require('lodash'),
    jsonpath = function (obj, path, assign) {
        var P = path ? path.split(/\./).reverse() : [],
            OO = obj,
            O = obj,
            key;

        while (key = P.pop()) {
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
            O[key] = assign;
        }

        return OO;
    };

function JPP (data) {
    this._data = data;
};

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
    }
};

module.exports = function (data) {
    return new JPP(data);
};
