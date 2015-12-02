'use strict';

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

	if (!(this instanceof CassandraCo)) return new CassandraCo(keyspace, hosts);

	this.keyspace = keyspace;
	this.hosts = hosts;
	this.adapter = new Adapter(keyspace, hosts, options);
	models[keyspace] = models[keyspace] || {};

	if (cache) this.cache = new LRU(cache);
}

_.extend(CassandraCo.prototype, {
	/**
  * @param {String} table The name of the table
  */
	getModel: function* (table) {
		if (!models[this.keyspace][table]) models[this.keyspace][table] = yield Model(table, this);
		return models[this.keyspace][table];
	},

	connect: function* () {
		yield promisify(this.adapter.client.connect.bind(this.adapter.client))();
	},

	_getTable: function* (table) {
		yield this.connect();
		return yield promisify(this.adapter.client.metadata.getTable.bind(this.adapter.client.metadata))(this.keyspace, table);
	}
});

CassandraCo.types = require('cassandra-driver').types;

module.exports = CassandraCo;