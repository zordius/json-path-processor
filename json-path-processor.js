/*jslint node:true */
'use strict';

var ld = require('lodash'),
    jsonpath = require('JSONPath');

function JPP (data) {
    this._data = data;
};

JPP.prototype = {
    value: function (path) {
        return path ? jsonpath.eval(this._data, path) : this._data;
    },
    get: function (path) {
    }
};

module.exports = function (data) {
    return new JPP(data);
};
