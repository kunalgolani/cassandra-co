# Helenus

[![GitHub version][github-img]][github-url]
[![Deps][deps-img]][deps-url]
[![Dev Deps][devDeps-img]][deps-url]
[![Peer Deps][peerDeps-img]][deps-url]

[![GitHub stars][stars-img]][github-url]
[![GitHub forks][forks-img]][github-url]
[![GitHub issues][issues-img]][github-url]

A very basic ORM and Client for Cassandra, inspired by [3logic's apollo-cassandra](https://github.com/3logic/apollo-cassandra/).

---

## Motivation
- apollo-cassandra requires you to define the schema in code. This means that any time the DB schema is altered, the code also needs to be updated. The code needs to be aware of the schema in the DB even if it's not otherwise using all columns of a table.
- When I looked into the internals of apollo-cassandra before starting this project, I couldn't find evidence of it using [prepared statements](http://docs.datastax.com/en/developer/nodejs-driver/2.1/nodejs-driver/reference/threeSimpleRules.html?scroll=three-simple-rules__prepared-statement-section). With Cassandra, if you're executing the same CQL query with different paramters repeatedly, preparing it makes its execution faster.

---

## Usage
### Promises and yields
All asynchronous operations return a `Promise`.  Using [`co`](https://github.com/tj/co) or [`koa`](koajs.com), these promises can also be `yield`ed. This documentation uses `yields` instead of `.then()` on the `Promise`s.

__Example__
```js
// Promise
asyncOperation().then(function(result) {
    // use the result here
});

// yield
var result = yield asyncOperation();
// use the result here
```

### Instantiation
__Parameters__
- {String} `keyspace`: The keyspace to operate on
- {Array} `hosts`: Hostnames of cassandra servers
- {Object} `options` [optional]: Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions.

__Example__ Initialize Helenus with `example` keyspace and local Cassandra
```js
var db = require('Helenus')('example', ['127.0.0.1']);
```

### Model
__Parameters__
- {String} `table`: The name of the table

__Example__ Initialize the model for `examples` table
```js
var Examples = yield db.getModel('examples');
```

### SELECT
__Parameters__
- {Object} `criteria` [optional]: The where clause criteria, including:
    column names as keys, and values as:
        value for exact match, or
        {Object} where:
            operators as keys and operands as values for numerical comparison,
            `in` as key and `{Array}` of values for `in` clause,
            `contains` or `containsKey` as key and the respective value or key to check for in the set, list or map as value
- {Object} `clauses` [optional]: Additional clauses such as:
    `distinct: ['column1', 'column2']`,
    `count: true`,
    `orderBy: column_name` for default (ascending), or `{Object}` with order (`asc|desc`) as key and `column_name` as value
    `limit: 100`,
    `allowFiltering: true`,
    `raw`: not wrapped in a `Helenus` object
- {Object} `options` [optional]: Any other query options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#QueryOptions

__Example__ Find at max 5 people named John Doe, older than 35, sorted older to younger
```js
var johns = yield Examples.find({
    name: 'John Doe',
    age: {
        '>': 35
    }
}, {
    limit: 5,
    orderBy: {
        desc: 'age'
    }
});
```

### INSERT
__Parameters__
- {Object} `data`: Data to initialize row instance with, column names as keys
- {Object} `clauses` [optional]: `ttl` and / or `timestamp` for the row being saved

__Example__ Add a new row to `examples` with a ttl of 5 minutes
```js
var johnny = new Examples({
    name: 'Johnny',
    age: 21
});

yield johnny.save({
    ttl: 300
});
```

### UPDATE
__Parameters__
- {Object} `clauses` [optional]: `ttl` and / or `timestamp` for the row being saved

__Example__ Change the name of the oldest person named 'John Doe' in `examples` to `Mr Grampa`
```js
johns[0].name = 'Mr Grampa';
yield johns[0].save();
```

### Counters
__Parameters__
- {String} column [optional]: the specific counter column to increment, not required if there's only one such column
- {Number} by [optional]: the amount to increment the counter by, assumed 1 if not given

__Example__ Increment the count for key `example1` whether or not it exists, and decrement the count for key `example2` by 2
```js
var Counter = yield db.getModel('counter'),
    counters = new Counter({key: 'example1'});
yield counter.increment();

var counters = Counter.find({key: 'example2'});
yield counters[0].decrement(2);
```

### DELETE
__Parameters__
- {Array} `columns` [optional]: If provided, the values from the given columns will be deleted; otherwise, the row will be deleted

__Example__ Delete the age of Mr Grampa
```js
yield johns[0].delete('age');
```

---

## Caveats
- Only prepared statements are supported. All operations will be executed as prepared statements.
- Helenus needs the following ES6/7 features.
    + [Generator Functions](http://davidwalsh.name/es6-generators)
    + [Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
    + [`Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)

    You can check if the above features are available in your javascript environment [here](http://kangax.github.io/compat-table/es6/). If you don't have them, you can get them in the following ways:
    + _The `--harmony` flag for node.js_ enables all stable es6 features in the v8 engine used in your version of node.js. Details: `man node | grep harmony`
    + _The `--harmony_<feature_name>` flags for node.js and io.js_ enable the respective features behind those flags in the v8 engine used in your version of [node|io].js. Details: `node|iojs --v8-options`
    + _Transpilers and Polyfills_ such as [Babel](babeljs.io) or [Traceur](https://github.com/google/traceur-compiler)

---

[github-img]: https://badge.fury.io/gh/kunalgolani%2Fhelenus.svg
[stars-img]: https://img.shields.io/github/stars/kunalgolani/helenus.svg
[forks-img]: https://img.shields.io/github/forks/kunalgolani/helenus.svg
[issues-img]: https://img.shields.io/github/issues-raw/kunalgolani/helenus.svg
[github-url]: https://github.com/kunalgolani/helenus
[deps-img]: https://img.shields.io/david/kunalgolani/helenus.svg
[devDeps-img]: https://img.shields.io/david/dev/kunalgolani/helenus.svg
[peerDeps-img]: https://img.shields.io/david/peer/kunalgolani/helenus.svg
[deps-url]: https://github.com/kunalgolani/helenus/blob/master/package.json