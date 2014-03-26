json-path-processor [![Dependency Status](https://david-dm.org/zordius/json-path-processor.png)](https://david-dm.org/zordius/json-path-processor)
==========

A common data processor target to process data without running try catch hell.

Install
-------

```
npm install json-path-processor
```

Usage
-----

All our life is to handle data....with a loop. Let's start from a basic loop:

```javascript
for (I in data) {
    data[I] = something();
}
```

To make jslint happy or ensure to loop scope, we should add property check:

```javascript
for (I in data) {
    if (data.hasOwnProperty(I)) {
        data[I] = something(data[I]);
    }
}
```

In real life, data is not always exist. We must handle none data case:

```javascript
if (data && is_object(data)) {
    for (I in data) {
        if (data.hasOwnProperty(I)) {
            data[I] = something(data[I]);
        }
    }
}
```

Further, please catch something() because there may some error inside it.

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

The loop becomes a nightmare now? Let's use lodash to reduce indents in the loop:

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
