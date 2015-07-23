(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.JsonPathProcessor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint node: true */
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqc29uLXBhdGgtcHJvY2Vzc29yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIganNvbnBhdGggPSBmdW5jdGlvbiAob2JqLCBwYXRoLCBhc3NpZ24sIGNyZWF0ZSwgZGVsKSB7XG4gICAgICAgIHZhciBQID0gcGF0aCA/IHBhdGguc3BsaXQoL1xcLi8pLnJldmVyc2UoKSA6IFtdLFxuICAgICAgICAgICAgT08gPSBvYmogPyBvYmogOiAoY3JlYXRlID8ge30gOiBudWxsKSxcbiAgICAgICAgICAgIE8gPSBvYmosXG4gICAgICAgICAgICBrZXk7XG5cbiAgICAgICAgaWYgKChPTyA9PT0gbnVsbCkgJiYgIWNyZWF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChQLmxlbmd0aCkge1xuICAgICAgICAgICAga2V5ID0gUC5wb3AoKTtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICBjYXNlICckJzpcbiAgICAgICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgoT09ba2V5XSAhPT0gdW5kZWZpbmVkKSAmJiAoT09ba2V5XSAhPT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICBPTyA9IE9PW2tleV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjcmVhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoUC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9PW2tleV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBPTyA9IE9PW2tleV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoUC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBPID0gT087XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVsKSB7XG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KE8pKXtcbiAgICAgICAgICAgICAgICBPLnNwbGljZShrZXksIDEpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZGVsZXRlIE9ba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPTztcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2lnbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgT1trZXldID0gYXNzaWduLmNhbGwgPyBhc3NpZ24oT08pIDogYXNzaWduO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIE8gPSBhc3NpZ24uY2FsbCA/IGFzc2lnbihPTykgOiBhc3NpZ247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgIGlmIChjcmVhdGUgJiYga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9ba2V5XSA9IGNyZWF0ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBPTztcbiAgICB9O1xuXG5mdW5jdGlvbiBKUFAgKGRhdGEpIHtcbiAgICB0aGlzLl9kYXRhID0gZGF0YTtcbn1cblxuSlBQLnByb3RvdHlwZSA9IHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7IFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGggPyBqc29ucGF0aCh0aGlzLl9kYXRhLCBwYXRoKSA6IHRoaXMuX2RhdGE7XG4gICAgfSxcbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgSlBQKHRoaXMudmFsdWUocGF0aCkpO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAocGF0aCwgdmFsdWUsIGNyZWF0ZSwgZGVsKSB7XG4gICAgICAgIGlmIChwYXRoICYmIHBhdGggIT09ICckJykge1xuICAgICAgICAgICAgaWYgKGNyZWF0ZSAmJiAoKHRoaXMuX2RhdGEgPT09IG51bGwpIHx8ICh0eXBlb2YgdGhpcy5fZGF0YSAhPT0gJ29iamVjdCcpKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGpzb25wYXRoKHRoaXMuX2RhdGEsIHBhdGgsIHZhbHVlLCBjcmVhdGUsIGRlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBqc29ucGF0aCh0aGlzLCAnX2RhdGEnLCB2YWx1ZSwgY3JlYXRlLCBkZWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgY29weTogZnVuY3Rpb24gKGZyb20sIHRvLCBza2lwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldCh0bywgdGhpcy52YWx1ZShmcm9tKSwgc2tpcCA/IHVuZGVmaW5lZCA6IG51bGwpO1xuICAgIH0sXG4gICAgZGVsOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgdW5kZWZpbmVkLCBmYWxzZSwgdHJ1ZSk7XG4gICAgfSxcbiAgICBtb3ZlOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKGZyb20pO1xuICAgICAgICBpZiAoViAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldCh0bywgViwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLmRlbChmcm9tKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGVhY2g6IGZ1bmN0aW9uIChwYXRoLCBjYiwgZWxzZWNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKTtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybiBlbHNlY2IgPyB0aGlzLnNldChwYXRoLCBlbHNlY2IsIHRydWUpIDogdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KFYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgVi5tYXAoZnVuY3Rpb24gKFYsIEkpIHtcbiAgICAgICAgICAgICAgICB2YXIgUjtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBSID0gY2IoViwgSSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoUiA9PT0gdW5kZWZpbmVkKSA/IFYgOiBSO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKEUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBmb3JJbjogZnVuY3Rpb24gKHBhdGgsIGNiLCBlbHNlY2IpIHtcbiAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKHBhdGgpLCBSID17fTtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybiBlbHNlY2IgPyB0aGlzLnNldChwYXRoLCBlbHNlY2IsIHRydWUpIDogdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgnb2JqZWN0JyA9PT0gdHlwZW9mIFYpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKFYpLm1hcChmdW5jdGlvbiAoRCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIFJbRF0gPSBjYihWW0RdLCBEKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgICAgIFJbRF0gPSBWW0RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIFIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uIChwYXRoLCBjYiwgZWxzZWNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgUjtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybiBlbHNlY2IgPyB0aGlzLnNldChwYXRoLCBlbHNlY2IsIHRydWUpIDogdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KFYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQocGF0aCwgVi5maWx0ZXIoZnVuY3Rpb24gKFYsIEkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2IoViwgSSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJ29iamVjdCcgPT09IHR5cGVvZiBWKSB7XG4gICAgICAgICAgICBSID0ge307XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhWKS5tYXAoZnVuY3Rpb24gKEQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IoVltEXSwgRCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJbRF0gPSBWW0RdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgICAgICAgICBSW0RdID0gVltEXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChwYXRoLCBSKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZmluZDogZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgSTtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoSSBpbiBWKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChjYihWW0ldKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVltJXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBmaW5kTGFzdDogZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gICAgICAgIHZhciBWID0gdGhpcy52YWx1ZShwYXRoKSwgSSwgUjtcblxuICAgICAgICBpZiAoIVYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoSSBpbiBWKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChjYihWW0ldKSkge1xuICAgICAgICAgICAgICAgICAgICBSID0gVltJXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChFKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFI7XG4gICAgfSxcbiAgICByYW5nZTogZnVuY3Rpb24gKHBhdGgsIGExLCBhMiwgYTMpIHtcbiAgICAgICAgdmFyIFIgPSBbXSwgSSwgYXJncyA9IFthMV07XG5cbiAgICAgICAgaWYgKGEyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChhMik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICBhcmdzLnVuc2hpZnQoMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYTMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYTMgPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoST1hcmdzWzBdO0k8YXJnc1sxXTtJKz1hMykge1xuICAgICAgICAgICAgICAgIFIucHVzaChJKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoRSkge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KHBhdGgsIFIsIFtdKTtcbiAgICB9LFxuICAgIGNvbmNhdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICBhbGwgPSBbXTtcblxuICAgICAgICBhcmdzLm1hcChmdW5jdGlvbiAoUCkge1xuICAgICAgICAgICAgdmFyIFYgPSB0aGlzLnZhbHVlKFApO1xuXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShWKSkge1xuICAgICAgICAgICAgICAgIGFsbCA9IGFsbC5jb25jYXQoVik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmIChhbGwubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnNldChhcmd1bWVudHNbMF0sIGFsbCwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpczsgXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZGF0YSwgcGF0aCkge1xuICAgIHJldHVybiBwYXRoID8ganNvbnBhdGgoZGF0YSwgcGF0aCkgOiAobmV3IEpQUChkYXRhKSk7XG59O1xuIl19
