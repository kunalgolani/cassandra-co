'use strict';

var Helenus = require('../src');

require('chai').should();

describe('dummy', function() {
	it('should run', function() {
		Helenus.types.should.not.be.empty;
	});
});