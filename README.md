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
data = jpp(data).each('product.title', function (V) {
    return something(V);
}).value();

// Ya, handle all product title and promotion description
// almost all jpp methods are chainable
data = jpp(data).each('extra.promotion', function (O) {
    O.description = someValue;
    return O;
}).each('product.title', someUtilFunc).value();
```

API document and example
------------------------

* `jpp(data)` : create the JPP chainning object by data.
```
var J = jpp(['any', 'data', {or: {recursive: {'object'}}}]);
```

* `.value(path)` : get the value(s) by JSON path. This is the only method can not be chainned. when path is undefined, get whole data.
```
console.log(jpp([1, 3, 5]).value()); // will get [1, 3, 5]
console.log(jpp({a: {b: 'OK'}}).value('a.b')); // will get 'OK'
console.log(jpp({a: {b: 'OK'}}).value('a.c.d')); // will get undefined
```

* `.get(path)`: get new JPP object by JSON path. All chainned methods on this is different from root object.
```
console.log(jpp({a: {b: 'OK'}}).get('a').get('b').value()); // will get 'OK'
```
* `.set(path, value, create)` : set new value by JSON path. When `value` is a function, execute the function with first argument as old value. the return value of the callback function will be assigned. when `create` is true, create new object by the JSON path.
```
// will get {a: {b: 'OK', c:[1, 3]}}
console.log(jpp({a: {b: 'OK', c: [1, 4]}}).set('a.c.1', 3).value());

// will get {a: {b: 'BAD', c:[1, 4]}}
console.log(jpp({a: {b: 'OK', c: [1, 4]}}).set('a.b', 'BAD').value());

// will get {a: {b: 'OK', c:[1, 4]}}
console.log(jpp({a: {b: 'OK', c: [1, 4]}}).set('a.b.c.d', 'OK?').value());

// set failed **WE CAN NOT CONVERT ARRAY TO OBJECT**
console.log(jpp({a: {b: 'OK', c: [1, 4]}}).set('a.b.c.d', 'OK?', true).value());

// a.b.c[2 ~ 9] will become undefined **ARRAY SIZE AUTO EXPEND IN JAVASCRIPT**
console.log(jpp({a: {b: 'OK', c: [1, 4]}}).set('a.b.c.10', 'OK?', true).value());
```

* `.each(path, function (value, key) {...})` : JPP wraped version of `lodash.each()`, the callback arguments are: value, index|key. The return value of callback will be assigned back to JPP object.
```
console.log(jpp({a: {b: [1, 3, 5]}}).each('a.b', function (V) {
    return V * 2;
}).value());  // will get {a: b: [2, 6, 10]}

console.log(jpp({a: {b: [1, 3, 5]}}).each('a.b', function (V, I) { // I as index
    return V * I;
}).value());  // will get {a: b: [0 , 3, 10]}
```

* `.forIn(path, function (value, key) {...})` : JPP wraped version of `lodash.forIn()`, the callback arguments are: value, index|key. The return value of callback will be assigned back to JPP object.
```
console.log(jpp({a: 'OK', b: 'BAD', length: 9}).forIn('$', function (V, I) {
    return V + '!';
}).value()); // will get {a: 'OK!', b: 'BAD!', length: '9!'} , forIn() will not think object with length property as array.
```

Supported JSON Path
-------------------

We only support absolute JSON Path and receive only one item.

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
