"use strict";

var _ = require('underscore'),
	Adapter = require('./adapter'),
	composer = require('./composer'),
	types = require('./types');


/** 
 * @param {String} table The name of the table
 * @param {Helenus} db The instance of Helenus used to create a model
 */

module.exports = function *(table, db) {
	
	var _columns = {},
		_keys = [];
	
	(yield Adapter('system', db.hosts).execute('select * from schema_columns where columnfamily_name = ? and keyspace_name = ?;', [table, db.keyspace])).forEach(column => {
		_columns[column.column_name] = types[column.validator];
		['partition_key', 'clustering_key'].includes(column.type) && _keys.push(column.column_name);
	});

	// extract:
		// column names
		// validators
		// primary keys

	function Row(data, exists) {
		if (!(this instanceof Row))
			return new Row(data);

		this._data = data;
		this._exists = exists;
		_.extend(this, data);
	}

	_.extend(Row, {

		meta: {
			_columns: _columns,
			_keys: _keys
		},

		/** 
		 * @param {Object} criteria [optional] The where clause criteria, including: 
		 	column names as keys, and values as:
		 		value for exact match, or
		 		{Object} where:
		 			operators as keys and operands as values for numerical comparison,
		 			'in' as key and {Array} of values for in clause,
		 			'contains' or 'containsKey' as key and the value or key to check for in the set, list or map as value
		 * @param {Object} clauses [optional] Additional clauses such as:
		 	distinct: ['column1', 'column2'],
		 	count: true,
		 	orderBy: 'column_name' for default (ascending), or {Object} with order (asc|desc) as key and 'column_name' as value
		 	limit: 100,
		 	allowFiltering: true,
		 	raw: not wrapped in a Helenus object
		 */

		find: function *(criteria, clauses) {
			criteria = criteria || {};
			clauses = clauses || {};

			var params = [];
				
			var select = composer.select(clauses),
				from = composer.from(table),
				where = composer.where(criteria, params),
				order = composer.order(clauses),
				limit = composer.limit(clauses, params),
				filtering = composer.filtering(clauses);
				
			var query = select + from + where + order + limit + filtering + ';';

			var raw = yield db.adapter.execute(query, params);

			if (clauses.raw)
				return raw;

			return raw.map(row => new Row(row, true));
		}

	});

	_.extend(Row.prototype, {

		save: function *() {
			this._validate();

			var data = _(this).chain()
						.pick(_columns)
						.omit(v => typeof v === 'undefined')
						.value();

			return this._exists ? yield this._update(data) : yield this._insert(data);
		},

		/** 
		 * @param {Array} columns [optional] If provided, the values from the given columns will be deleted; otherwise, the row will be deleted
		 */
		delete: function *(columns) {
			if (_.difference(columns, _columns).length)
				throw new Error('trying to delete columns that don\'t exist in the table: ' + columns.join(', '));

			this._validate(true);

			var params = [];

			var del = composer.delete(columns || []),
				from = composer.from(table),
				where = this._where(params);

			var query = del + from + where;

			var raw = yield db.adapter.execute(query, params);
			console.log(raw); // check

			return this;
		},

		_where: function(params) {
			var criteria = _.pick(this, _keys);
			return composer.where(criteria, params);
		},

		_insert: function *(data) {
			var params = [];

			var insert = composer.insert(table),
				values = composer.values(data, params);

			var query = insert + values;

			var raw = yield db.adapter.execute(query, params);
			console.log(raw); // check

			return this;
		},

		_update: function *() {
			var params = [];

			var update = composer.update(table),
				set = composer.set(data, params),
				where = this._where(params);

			var query = update + set + where;

			var raw = yield db.adapter.execute(query, params);
			console.log(raw); // check

			return this;
		},

		_validate: function(skipTypeChecks) {
			// do keys exist?
			_keys.forEach(key => {
				if (!this.hasOwnProperty(key))
					throw new Error('part of primary key ' + key + ' missing');
			});
			
			if (skipTypeChecks)
				return;

			// types of all columns
		}

	});

	return Row;
};
