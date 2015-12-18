'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
 * @param {Array} contactPoints hostnames of cassandra servers
 * @param {Object} options [optional] Any other client options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#ClientOptions
 */

function Adapter(keyspace, contactPoints) {
	let options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	var hosts = contactPoints.sort().toString();

	adapters[hosts] = adapters[hosts] || {};

	if (adapters[hosts][keyspace]) return adapters[hosts][keyspace];

	if (!(this instanceof Adapter)) return new Adapter(keyspace, contactPoints);

	this.client = new driver.Client(_extends({}, DEFAULTS, options, {
		keyspace: keyspace,
		contactPoints: contactPoints
	}));

	// this.client.on('log', (level, className, message) => console.log('Cassandra %s: %s', level, message));

	adapters[hosts][keyspace] = this;
}

_.extend(Adapter.prototype, {

	/**
  * @param {String} query The query to execute, with ? placeholders for ordered params
  * @param {Array} [params] Ordered params to replace ?s in query
  * @param {Object} {queryOptions} Override default query options such as prepare
  */

	execute: function* (query, params, queryOptions) {
		try {
			return yield promisify(this.client.execute.bind(this.client))(query, params, queryOptions);
		} catch (e) {
			console.error('Cassandra Client Error:\nQuery: ', query, '\nParams: ', params, '\nError: ', e);
			throw e;
		}
	}

});

module.exports = Adapter;