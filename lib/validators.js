"use strict";

var _ = require("underscore");
// import cassandra types here
var Long = require("cassandra-driver").types.Long;

var ip4 = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/i,
    ip6_1 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/i,
    ip6_2 = /^((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)::((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)$/i,
    uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

module.exports = {
    "ascii": _.isString,
    "bigint": Long.isLong, // what to do here?
    "blob": isAnything,
    "boolean": _.isBoolean,
    "counter": Number.isInteger,
    "decimal": _.isNumber,
    "double": _.isNumber,
    "float": _.isNumber,
    "inet": isInet,
    "int": Number.isInteger,
    "text": _.isString,
    "timestamp": isTimestamp,
    "timeuuid": isUuid,
    "uuid": isUuid,
    "varchar": _.isString,
    "varint": Number.isInteger
};

var isAnything = () => true,
    isInet = inet => _.isString(inet) && (ip4.test(inet) || ip6_1.test(inet) || ip6_2.test(inet)),
    isTimestamp = timestamp => _.isNumber(timestamp) && _.isDate(new Date(timestamp)),
    isUuid = id => _.isString(id) && uuid.test(id);
//# sourceMappingURL=validators.js.map