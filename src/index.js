'use strict';

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

function CassandraCo(keyspace, hosts, {cache, ...options} = {}) {
	if (!(this instanceof CassandraCo))
		return new CassandraCo(keyspace, hosts, {cache, ...options});

	this.keyspace = keyspace;
	this.hosts = hosts;
	this.adapter = new Adapter(keyspace, hosts, options);
	if (cache)
		this.cache = new LRU(cache);

	models[keyspace] = models[keyspace] || {};
}

_.extend(CassandraCo.prototype, {
	/**
	 * @param {String} table The name of the table
	 */
	*getModel(table) {
		if (!models[this.keyspace][table])
			models[this.keyspace][table] = yield Model(table, this);
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