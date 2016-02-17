'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _ = require('underskore'),
    promisify = require('es6-promisify'),
    Adapter = require('./adapter'),
    Model = require('./model'),
    LRU = require('lru-cache'),
    models = {};

/**
 * @param {String} keyspace The keyspace to operate on
 * @param {Array} hosts Hostnames of cassandra servers
 * @param {Object} options [optional] Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function CassandraCo(keyspace, hosts) {
	var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	let cache = _ref.cache;

	let options = _objectWithoutProperties(_ref, ['cache']);

	if (!(this instanceof CassandraCo)) return new CassandraCo(keyspace, hosts, _extends({ cache }, options));

	this.keyspace = keyspace;
	this.hosts = hosts;
	this.adapter = new Adapter(keyspace, hosts, options);
	if (cache) this.cache = new LRU(cache);

	models[keyspace] = models[keyspace] || {};
}

_.extend(CassandraCo.prototype, {
	/**
  * @param {String} table The name of the table
  */
	*getModel(table) {
		if (!models[this.keyspace][table]) models[this.keyspace][table] = yield Model(table, this);
		return models[this.keyspace][table];
	},

	*connect() {
		yield promisify(this.adapter.client.connect.bind(this.adapter.client))();
	},

	*_getTable(table) {
		yield this.connect();
		return yield promisify(this.adapter.client.metadata.getTable.bind(this.adapter.client.metadata))(this.keyspace, table);
	}
});

CassandraCo.types = require('cassandra-driver').types;

module.exports = CassandraCo;