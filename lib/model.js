'use strict';

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _ = require('underskore'),
    types = require('cassandra-driver').types.dataTypes,
    composer = require('./composer');

/**
 * @param {String} table The name of the table
 * @param {CassandraCo} db The instance of CassandraCo used to create a model
 */

module.exports = function* (table, db) {

	var metadata = yield db._getTable(table),
	    _columns = _.mapObject(metadata.columnsByName, _ref => {
		let type = _ref.type;
		return _.findKey(types, t => type.code === t);
	}),
	    _keys = _.pluck(metadata.partitionKeys.concat(metadata.clusteringKeys), 'name');

	/**
  * @param {Object} data Data to initialize row instance with, column names as keys
  */
	function Row(data, exists) {
		if (!(this instanceof Row)) return new Row(data);

		this._data = exists ? data : {};
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
  			'contains' or 'containsKey' as key and the respective value or key to check for in the set, list or map as value
   * @param {Object} clauses [optional] Additional clauses such as:
  	distinct: ['column1', 'column2'],
  	count: true,
  	orderBy: column_name for default (ascending), or {Object} with order (asc|desc) as key and column_name as value
  	limit: 100,
  	allowFiltering: true,
  	raw: not wrapped in a CassandraCo object
   * @param {Object} options [optional] Any other query options as defined in http://www.datastax.com/drivers/nodejs/2.0/global.html#QueryOptions
   */

		find: function* () {
			let criteria = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
			let clauses = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var _ref2 = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

			let cache = _ref2.cache;
			let maxAge = _ref2.maxAge;
			var _ref2$stats = _ref2.stats;
			let stats = _ref2$stats === undefined ? {} : _ref2$stats;

			let options = _objectWithoutProperties(_ref2, ['cache', 'maxAge', 'stats']);

			var params = [];

			var select = composer.select(clauses),
			    from = composer.from(table),
			    where = composer.where(criteria, params),
			    order = composer.order(clauses),
			    limit = composer.limit(clauses, params),
			    filtering = composer.filtering(clauses);

			var query = select + from + where + order + limit + filtering;

			var key = query + ' : ' + params,
			    raw;

			if (cache && db.cache && db.cache.has(key)) {
				raw = db.cache.get(key);
				raw._cached = true;
				stats.hit && stats.hit();
			} else {
				raw = yield db.adapter.execute(query, params, options);
				if (cache && db.cache) {
					db.cache.set(key, raw, maxAge);
					stats.miss && stats.miss();
				}
			}

			if (clauses.raw) return _.extend(raw.rows, raw);

			return _.extend(raw.rows.map(row => new Row(row, true)), raw);
		}

	});

	_.extend(Row.prototype, {

		/**
   * @param {Object} clauses [optional] 'ttl' and / or 'timestamp' for the row being saved
   */
		save: function* () {
			let clauses = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this._validate();
			return yield this[this._exists ? '_update' : '_insert'](this._getData(), clauses);
		},

		/**
   * @param {Number} by [optional] the amount to increment the counter by, assumed 1 if not given
   * @param {String} column [optional] the specific counter column to increment, not required if there's only one such column
   */
		increment: function* () {
			let by = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
			let column = arguments.length <= 1 || arguments[1] === undefined ? _.findKey(_columns, type => type === 'counter') : arguments[1];

			this._validate();

			var params = [];

			var update = composer.update(table),
			    increment = composer.increment(column, by),
			    where = this._where(params);

			var query = update + increment + where;

			yield db.adapter.execute(query, params);

			return this;
		},

		/**
   * @param {String} column [optional] the specific counter column to decrement, not required if there's only one such column
   * @param {Number} by [optional] the amount to decrement the counter by, assumed 1 if not given
   */
		decrement: function* () {
			let by = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
			let column = arguments.length <= 1 || arguments[1] === undefined ? _.findKey(_columns, type => type === 'counter') : arguments[1];

			this._validate();

			var params = [];

			var update = composer.update(table),
			    decrement = composer.decrement(column, by),
			    where = this._where(params);

			var query = update + decrement + where;

			yield db.adapter.execute(query, params);

			return this;
		},

		/**
   * @param {Array} columns [optional] If provided, the values from the given columns will be deleted; otherwise, the row will be deleted
   */
		delete: function* (columns) {
			if (_.difference(columns, _columns).length) throw new Error('trying to delete columns that don\'t exist in the table: ' + columns.join(', '));

			this._validate();

			var params = [];

			var del = composer.delete(columns || []),
			    from = composer.from(table),
			    where = this._where(params);

			var query = del + from + where;

			yield db.adapter.execute(query, params);

			return this;
		},

		_where: function (params) {
			var criteria = _.chain(this).pick(_keys).mapObject((val, key) => ['bigint', 'counter', 'decimal', 'inet', 'timeuuid', 'uuid', 'varint'].includes(_columns[key]) ? val.toString() : _columns[key] === 'timestamp' ? +val : val).value();
			return composer.where(criteria, params);
		},

		_insert: function* (data) {
			let clauses = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var params = [];

			var insert = composer.insert(table),
			    values = composer.values(data, params),
			    using = composer.using(clauses, params);

			var query = insert + values + using;

			yield db.adapter.execute(query, params);

			this._exists = true;
			this._data = data;

			return this;
		},

		_update: function* (data) {
			let clauses = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var params = [];

			var update = composer.update(table),
			    using = composer.using(clauses, params),
			    set = composer.set(data, params),
			    where = this._where(params);

			var query = update + using + set + where;

			yield db.adapter.execute(query, params);

			this._data = data;

			return this;
		},

		_getData: function () {
			return _(this).chain().pick(_.keys(_columns)).omit(v => v === undefined).delta(this._data).value();
		},

		_validate: function () {
			// do keys exist?
			_keys.forEach(key => {
				if (!this.hasOwnProperty(key)) throw new Error('part of primary key ' + key + ' missing');
			}, this);

			// type validations inbuilt into cassandra-driver
		}

	});

	return Row;
};