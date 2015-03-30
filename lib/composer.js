"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _ = require("underskore");

// composes various parts of CQL statements, updating the params array along the way

module.exports = {
	select: clauses => "select " + (clauses.count ? "count(*)" : clauses.distinct ? "distinct " + clauses.distinct.join(", ") : "*"),

	delete: columns => "delete " + columns.join(", "),

	insert: table => "insert into " + table,

	update: table => "update " + table,

	from: table => " from " + table,

	values: (data, params) => {
		let values = _.values(data);

		params.push.apply(params, _toConsumableArray(values));

		return " (" + _.keys(data).join(", ") + ") values (" + values.map(v => "?").join(", ") + ")";
	},

	set: (data, params) => params.push.apply(params, _toConsumableArray(_.values(data))) && " set " + _(data).map((value, key) => key + "=?").join(", "),

	where: (criteria, params) => {

		let where = _(criteria).chain().omit(v => v === undefined).map((conditions, column) => {
			if (typeof conditions !== "object") {
				params.push(conditions);
				return column + "=?";
			}

			return _(conditions).chain().omit(v => v === undefined).map((operand, operator) => {
				switch (operator) {
					case "in":
						params.concat(operand);
						return column + " in (" + operand.map(v => "?").join(", ") + ")";
					case "contains":
						params.push(operand);
						return column + " contains ?";
					case "containsKey":
						params.push(operand);
						return column + " contains key ?";
					default:
						params.push(operand);
						return column + operator + "?";
				}
			}).value().join(" and ");
		}).reject(_.isEmpty).value().join(" and ");

		return where ? " where " + where : "";
	},

	order: clauses => clauses.orderBy ? " order by " + (clauses.orderBy.desc || clauses.orderBy.asc || clauses.orderBy) + (clauses.orderBy.desc ? " desc" : "") : "",

	limit: (clauses, params) => clauses.limit ? params.push(clauses.limit) && " limit ?" : "",

	filtering: clauses => clauses.allowFiltering ? " allow filtering" : ""
};