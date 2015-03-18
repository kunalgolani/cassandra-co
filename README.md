# helenus
A very basic ORM and Client for Cassandra, inspired by [3logic's apollo-cassandra](https://github.com/3logic/apollo-cassandra/).

## Caveats
Helenus needs the following ES6/7 features.
+ [Generator Functions](http://davidwalsh.name/es6-generators)
+ [Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
+ [`Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)

You can check if the above features are available in your javascript environment [here](http://kangax.github.io/compat-table/es6/). If you don't have them, you can get them in the following ways:
+ *The `--harmony` flag for node.js* enables all stable es6 features in the v8 engine used in your version of node.js. Details: `man node | grep harmony`
+ *The `--harmony_<feature_name>` flags for node.js and io.js* enable the respective features behind those flags in the v8 engine used in your version of [node|io].js. Details: `node|iojs --v8-options`
+ *Transpilers and Polyfills* such as [Babel](babeljs.io) or [Traceur](https://github.com/google/traceur-compiler)
