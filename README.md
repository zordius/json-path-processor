json-path-processor [![Dependency Status](https://david-dm.org/zordius/json-path-processor.png)](https://david-dm.org/zordius/json-path-processor) [![Build Status](https://travis-ci.org/zordius/json-path-processor.svg?branch=master)](https://travis-ci.org/zordius/json-path-processor)
==========

JsonPathProcessor (JPP) - A common data processor target to process data without running try catch hell.

Install
-------

```
npm install json-path-processor
```

Features
--------

* Chainning
* Iterate objects by simplified JSONPath
* Catch all throwed error automatically

Usage
-----

```javascript
var jpp = require('json-path-processor');

// I wanna update all product title
data = jpp(data).each('product', function (J) {
    return J.set('title', something()).value();
}).value();

// Ya, handle all product title and promotion description
// almost all jpp methods are chainable
data = jpp(data).each('extra.promotion', function (J) {
    return J.set('description', somevalue).value();
}).each('product', function (J) {
    return J.set('title', somevalue).value();
}).value();
```

API document
------------

* `jpp(data)` : create the JPP chainning object by data.
* `.value(path)` : get the value(s) by JSON path. This is the only method can not be chainned. when path is undefined, get whole data.
* `.get(path): get new JPP object by JSON path. All chainned methods on this is different from root object.
* `.set(path, value)` : set new value by JSON path.
* `.each(path, function (value, key) {...})` : JPP wraped version of `_.each()`, the callback arguments are: value, index|key. The return value of callback will be assigned back to JPP object.
* `.forIn(path, function (value, key) {...})` : JPP wraped version of `_.forIn()`, the callback arguments are: value, index|key. The return value of callback will be assigned back to JPP object.

Supported JSON Path
-------------------

We only support absolute JSON Path and only receive one item.

* $ : refer to self
* $.foo.bar : refer to foo then bar key
* $.foo.3.bar : refer to foo then 4th array item then bar key

The long version of the story
-----------------------------

All our life is to handle data....with a loop. Let's start from a basic loop:

```javascript
for (I in data) {
    data[I] = something(data[I]);
}
```

To make jslint happy or ensure the loop correct, we should add property check:

```javascript
for (I in data) {
    if (data.hasOwnProperty(I)) {
        data[I] = something(data[I]);
    }
}
```

In real life, data is not always ready. We must handle none data case:

```javascript
if (data && is_object(data)) {
    for (I in data) {
        if (data.hasOwnProperty(I)) {
            data[I] = something(data[I]);
        }
    }
}
```

Furthermore, please catch something() because they may throw some error.

```javascript
if (data && is_object(data)) {
    for (I in data) {
        if (data.hasOwnProperty(I)) {
            try {
                data[I] = something(data[I]);
            } catch (E) {
                handle_error(E);
            }
        }
    }
}
```

The more assign in the loop, the more try/catch you need.

```javascript
if (data && is_object(data)) {
    for (I in data) {
        if (data.hasOwnProperty(I)) {
            try {
                data[I].title = something(data[I].title);
            } catch (E) {
                handle_error(E);
            }
            try {
                data[I].desciption = something(data[I].description);
            } catch (E) {
                handle_error(E);
            }
            try {
                data[I].url = something(data[I].url);
            } catch (E) {
                handle_error(E);
            }
        }
    }
}
```

The loop becomes a nightmare now, right? Let's use lodash to reduce indents in the loop:

```javascript
_(data).each(function(V) {
    try {
        V.title = something(V.title);
    } catch (E) {
        handle_error(E);
    }
    try {
        V.desciption = something(V.description);
    } catch (E) {
        handle_error(E);
    }
    try {
        V.url = something(V.url);
    } catch (E) {
        handle_error(E);
    }
});

```

But, lodash still can not reduce the try/catch hell for you. Now, JsonPathProcessor help on this!
