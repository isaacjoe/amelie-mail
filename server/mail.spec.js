'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('sinon-chai'));

const Mail = require('./mail');

describe.only('Mail', () => {
	let mail;

	beforeEach(() => {
		mail = new Mail(123);
	});

	it('must have an uid', () => {
		expect(mail.uid).to.equal(123);
	});

	it('can have a messageId', () => {
		let result = mail.withMessageId('message@id');
		expect(mail.messageId).to.equal('message@id');
		expect(result).to.equal(mail);
	});

	it('fails when setting a from that is not an array', () => {
		expect(() => mail.withFrom('from')).to.throw(mail.errors.mustBeArray('from'));
	});

	it('fails when setting a to that is not an array', () => {
		expect(() => mail.withTo('to')).to.throw(mail.errors.mustBeArray('to'));
	});

	it('can have a from', () => {
		let result = mail.withFrom(['one', 'two']);
		expect(mail.from).to.deep.equal(['one', 'two']);
		expect(result).to.equal(mail);
	})

	it('can have a to', () => {
		let result = mail.withTo(['one', 'two']);
		expect(mail.to).to.deep.equal(['one', 'two']);
		expect(result).to.equal(mail);
	})

	it('can have a subject', () => {
		let result = mail.withSubject('Some subject');
		expect(mail.subject).to.equal('Some subject');
		expect(result).to.equal(mail);
	})

	it('fails when withBody called without a bodyType', () => {
		expect(() => mail.withBody('Something')).to.throw(mail.errors.missingBodyType || '(error not defined)');
	});

	it('can have a body and bodyType', () => {
		let result = mail.withBody('Some body.', 'text/html');
		expect(mail.body).to.equal('Some body.');
		expect(mail.bodyType).to.equal('text/html');
		expect(result).to.equal(mail);
	})

	it('can be seen or not seen', () => {
		let result = mail.withIsSeen(true);
		expect(mail.isSeen).to.equal(true);
		expect(result).to.equal(mail);
	})

	it('should set a preview from plain text', () => {
		mail.withBody('Some plain text', 'text/plain');
		expect(mail.preview).to.equal('Some plain text');
	});

	it('should not set a preview from html', () => {
		mail.withBody('Some html', 'text/html');
		expect(mail.preview).to.be.undefined;
	});

	it('should not trim the preview if it is less than 200 characters', () => {
		mail.withBody('Proin in lectus sit amet lacus ultricies ornare vitae ultrices tellus.', 'text/plain');
		expect(mail.preview).to.equal('Proin in lectus sit amet lacus ultricies ornare vitae ultrices tellus.');
	});

	it('should trim the preview to at most 200 characters, ending with a dot if possible.', () => {
		mail.withBody('Lorem kva ipsum dolor sit amet, consectetur adipiscing elit. Donec varius convallis dignissim. Cras enim lacus, volutpat et justo in, feugiat cursus dui. Duis aliquam tortor quam, id tempor sem sollicitudin eget. Maecenas ac vulputate metus, id volutpat.', 'text/plain');
		expect(mail.preview).to.equal('Lorem kva ipsum dolor sit amet, consectetur adipiscing elit. Donec varius convallis dignissim. Cras enim lacus, volutpat et justo in, feugiat cursus dui.');
	});

	it('should trim the preview to at most 200 characters, ending with ellipsis if a dot ending is not possible.', () => {
		mail.withBody('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec varius convallis dignissim. Cras enim lacus, volutpat et justo in, feugiat cursus dui, duis aliquam tortor quam, id tempor sem sollicitudin eget. Maecenas ac vulputate metus, id volutpat.', 'text/plain');
		expect(mail.preview).to.equal('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec varius convallis dignissim. Cras enim lacus, volutpat et justo in, feugiat cursus dui, duis aliquam tortor quam, id tempor sem sollicitu…');
	});
});
