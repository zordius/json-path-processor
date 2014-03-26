json-path-processor [![Dependency Status](https://david-dm.org/zordius/json-path-processor.png)](https://david-dm.org/zordius/json-path-processor)
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
* Iterate objects by JSONPath
* Catch all throwed error automatically

Usage
-----

```javascript
var jpp = require('json-path-processor');

// I wanna update all product title
data = jpp(data).each('$.product[*].title', function (V) {
    return something(V);
}).value();

// Ya, handle all title and description
data = jpp(data).each('$.product[*].title', function (V) {
    return modified_title(V);
}).each('$.product[*].description', function (V) {
    return modified_description(V);
}).value();
```

API document
------------

* `jpp(data)` : create the JPP chainning object.
* `.value(path)` : get the value(s) by json path. This is the only method can not be chainned.
* `.get(path): get new JPP object by json path. All chainned methods on this is different from root object.
* `.set(path, value)` : set new value to 1 or more objects by json path.
* `.each(path, function (J) {...})` : JPP wraped version of `_.each()`
* `.forIn(path, function (J) {...})` : JPP wraped version of `_.forIn()`

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
