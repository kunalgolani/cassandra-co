'use strict';

var CassandraCo = require('../src');

require('chai').should();

describe('dummy', () => {
	it('should run', () => {
		CassandraCo.types.should.not.be.empty;
	});
});