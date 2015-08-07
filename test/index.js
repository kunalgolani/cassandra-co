'use strict';

var CassandraCo = require('../src');

require('chai').should();

describe('dummy', function() {
	it('should run', function() {
		CassandraCo.types.should.not.be.empty;
	});
});