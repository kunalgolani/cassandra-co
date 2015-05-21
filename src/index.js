"use strict";

var _ = require('underskore'),
	Adapter = require('./adapter'),
	Model = require('./model'),
	models = {};


/**
 * @param {String} keyspace The keyspace to operate on
 * @param {Array} hosts hostnames of cassandra servers
 * @param {Object} options Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function Helenus(keyspace, hosts, options) {
	if (!(this instanceof Helenus))
		return new Helenus(keyspace, hosts);

	this.keyspace = keyspace;
	this.hosts = hosts;
	this.adapter = new Adapter(keyspace, hosts, options);
	models[keyspace] = models[keyspace] || {};
}

_.extend(Helenus.prototype, {
	/**
	 * @param {String} table The name of the table
	 */
	getModel: function *(table) {
		if (!models[this.keyspace][table])
			models[this.keyspace][table] = yield Model(table, this);
		return models[this.keyspace][table];
	}
});

Helenus.types = require('cassandra-driver').types;

module.exports = Helenus;