"use strict";

var _ = require('underscore'),
    Long = require('long');

var ip4 = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/i,
    ip6_1 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/i,
    ip6_2 = /^((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)::((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)$/i,
    uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;


module.exports = {
    'ascii': 		_.isString,    
    'bigint': 		Long.isLong,
    'blob': 		isAnything,
    'boolean': 		_.isBoolean,        
    'counter': 		isInteger,
    'decimal': 		_.isNumber,        
    'double': 		_.isNumber,
    'float': 		_.isNumber,
    'inet': 		isInet,
    'int': 			isInteger,
    'text': 		_.isString,
    'timestamp': 	isTimestamp,
    'timeuuid': 	isUuid,
    'uuid': 		isUuid,
    'varchar': 		_.isString,    
    'varint': 		isInteger
};

var isInteger = integer => _.isNumber(integer) && integer % 1 === 0,
	isAnything = anything => true,
	isInet = inet => _.isString(inet) && (ip4.test(inet) || ip6_1.test(inet) || ip6_2.test(inet)),
	isTimestamp = timestamp => _.isNumber(timestamp) && _.isDate(new Date(timestamp)),
	isUuid = id => _.isString(id) && uuid.test(id);
