'use strict';

var _ = require('underskore'),
	driver = require('cassandra-driver'),
	promisify = require('es6-promisify'),
	adapters = {};

const DEFAULTS = {
	queryOptions: {
		prepare: true
	}
};


/**
 * @param {String} keyspace The keyspace to operate on
 * @param {Array} hosts hostnames of cassandra servers
 * @param {Object} options [optional] Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function Adapter(keyspace, hosts, options = {}) {
	var _hosts = '' + hosts;
	if (adapters[keyspace][_hosts])
		return adapters[keyspace][_hosts];

	if (!(this instanceof Adapter))
		return new Adapter(keyspace, hosts);

	this.client = new driver.Client({
		...DEFAULTS,
		...options,
		keyspace,
		contactPoints: hosts
	});

	// this.client.on('log', (level, className, message) => console.log('Cassandra %s: %s', level, message));

	adapters[keyspace][_hosts] = this;
}


_.extend(Adapter.prototype, {

	/**
	 * @param {String} query The query to execute, with ? placeholders for ordered params
	 * @param {Array} [params] Ordered params to replace ?s in query
	 * @param {Object} {queryOptions} Override default query options such as prepare
	 */

	*execute(query, params, queryOptions) {
		try {
			return yield promisify(this.client.execute.bind(this.client))(query, params, queryOptions);
		} catch (e) {
			console.error('Cassandra Client Error:\nQuery: ', query, '\nParams: ', params, '\nError: ', e);
			throw e;
		}
	}


});


module.exports = Adapter;