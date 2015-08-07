'use strict';

var _ = require('underskore'),
    promisify = require('es6-promisify'),
    Adapter = require('./adapter'),
    Model = require('./model'),
    models = {};

/**
 * @param {String} keyspace The keyspace to operate on
 * @param {Array} hosts Hostnames of cassandra servers
 * @param {Object} options [optional] Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function CassandraCo(keyspace, hosts, options) {
	if (!(this instanceof CassandraCo)) return new CassandraCo(keyspace, hosts);

	this.keyspace = keyspace;
	this.hosts = hosts;
	this.adapter = new Adapter(keyspace, hosts, options);
	models[keyspace] = models[keyspace] || {};
}

_.extend(CassandraCo.prototype, {
	/**
  * @param {String} table The name of the table
  */
	getModel: function* (table) {
		if (!models[this.keyspace][table]) models[this.keyspace][table] = yield Model(table, this);
		return models[this.keyspace][table];
	},

	_getTable: function* (table) {
		yield promisify(this.adapter.client.connect.bind(this.adapter.client))();
		return yield promisify(this.adapter.client.metadata.getTable.bind(this.adapter.client.metadata))(this.keyspace, table);
	}
});

CassandraCo.types = require('cassandra-driver').types;

module.exports = CassandraCo;