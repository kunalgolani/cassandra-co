"use strict";

var _ = require("underskore"),
    driver = require("cassandra-driver"),
    promisify = require("es6-promisify"),
    defaults = {
	queryOptions: {
		prepare: true
	}
},
    adapters = {};

/**
 * @param {String} keyspace The keyspace to operate on
 * @param {Array} hosts hostnames of cassandra servers
 * @param {Object} options [optional] Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function Adapter(keyspace, hosts, options) {
	if (adapters[keyspace]) return adapters[keyspace];

	if (!(this instanceof Adapter)) return new Adapter(keyspace, hosts);

	this.client = new driver.Client(_.extend({}, defaults, options, {
		keyspace: keyspace,
		contactPoints: hosts
	}));

	adapters[keyspace] = this;
}

_.extend(Adapter.prototype, {

	/**
  * @param {String} query The query to execute, with ? placeholders for ordered params
  * @param {Array} [params] Ordered params to replace ?s in query
  * @param {Object} {queryOptions} Override default query options such as prepare
  */

	execute: function* (query, params, queryOptions) {
		return yield promisify(this.client.execute.bind(this.client))(query, params, queryOptions);
	}

});

module.exports = Adapter;