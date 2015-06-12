'use strict';

var _ = require('underskore');


// composes various parts of CQL statements, updating the params array along the way

module.exports = {
	select: ({count, distinct}) => 'select ' +
							(count ?
								'count(*)' :
								distinct ?
									'distinct ' + distinct.join(', ') :
									'*'),

	delete: columns => 'delete ' + columns.join(', '),

	insert: table => 'insert into ' + table,

	update: table => 'update ' + table,

	from: table => ' from ' + table,

	values: (data, params) => {
		let values = _.values(data);

		params.push(...values);

		return ' (' + _.keys(data).join(', ') + ') values (' + values.map(() => '?').join(', ') + ')';
	},

	set: (data, params) => params.push(... _.values(data)) && ' set ' + _(data).map((value, key) => key + '=?').join(', '),

	where: (criteria, params) => {

		let where = _(criteria)
						.chain()
						.omit(v => v === undefined)
						.map((conditions, column) => {
							if (typeof conditions !== 'object') {
								params.push(conditions);
								return column + '=?';
							}

							return _(conditions)
									.chain()
									.omit(v => v === undefined)
									.map((operand, operator) => {
										switch (operator) {
											case 'in':
												params.concat(operand);
												return column + ' in (' + operand.map(() => '?').join(', ') + ')';
											case 'contains':
												params.push(operand);
												return column + ' contains ?';
											case 'containsKey':
												params.push(operand);
												return column + ' contains key ?';
											default:
												params.push(operand);
												return column + operator + '?';
										}
									})
									.value()
									.join(' and ');
						})
						.reject(_.isEmpty)
						.value()
						.join(' and ');

		return where ? ' where ' + where : '';
	},

	order: ({orderBy}) => orderBy ?
						' order by ' + (orderBy.desc || orderBy.asc || orderBy) +
							(orderBy.desc ? ' desc' : '') :
						'',

	limit: ({limit}, params) => limit ? (params.push(limit) && ' limit ?') : '',

	using: ({ttl, timestamp}, params) => {
		let using = [];
		ttl && params.push(ttl) && using.push('ttl ?');
		timestamp && params.push(timestamp) && using.push('timestamp ?');
		return using.length ? ' using ' + using.join(' and ') : '';
	},

	filtering: clauses => clauses.allowFiltering ? ' allow filtering' : ''
};