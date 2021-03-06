/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ContactService } from './contact.service';

describe('ContactService', () => {
	let service: ContactService;
	let contact;
	let channels;

	beforeEach(() => {
		channels = {};
		global.electron = {
			ipcRenderer: {
				on: jasmine.createSpy('ipcRenderer.on').and.callFake((channel, callback) => {
					channels[channel] = callback;
				}),
				send: jasmine.createSpy('ipcRenderer.send')
			}
		};
		contact = {
			name: 'Amelie P',
			address: 'amelie.p@mail.fr'
		}
		TestBed.configureTestingModule({
			providers: [ContactService]
		});
		service = TestBed.get(ContactService);
	});

	it('getAll returns an empty array initially', () => {
		expect(service.getAll()).toEqual([]);
	});

	it('register fails when called without a contact', () => {
		expect(() => service.register()).toThrowError(service.errors.contactArgumentMissing());
	});

	it('getAll returns an array with a contact registered by register', () => {
		service.register(contact);
		expect(service.getAll()).toEqual([contact]);
	});

	it('getByAddress returns a contact by mail address', () => {
		service.register(contact);
		expect(service.getByAddress('amelie.p@mail.fr')).toEqual(contact);
	});

	it('getByAddress returns undefined when the requested address is not registered', () => {
		expect(service.getByAddress('some.body@mail.fr')).toBeUndefined();
	});

	it('can register more than one contact', () => {
		let another = {
			name: 'Olivia R',
			address: 'olivia.r@mail.fr'
		};
		service.register(contact);
		service.register(another);
		expect(service.getAll()).toEqual([contact, another]);
	});

	it('after registering another contact with the same address but different name, replaces the first one with the latter', () => {
		let another = {
			name: 'Amelie Q',
			address: 'amelie.p@mail.fr'
		};
		service.register(contact);
		service.register(another);
		expect(service.getAll()).toEqual([another]);
	});

	it('after registering another contact with the same address but empty name, leaves the first one and discards the latter', () => {
		let another = {
			address: 'amelie.p@mail.fr'
		};
		service.register(contact);
		service.register(another);
		expect(service.getAll()).toEqual([contact]);
	});

	it('registers for a contacts:me channel', () => {
		expect(electron.ipcRenderer.on).toHaveBeenCalledWith('contacts:me', jasmine.any(Function));
	});

	it('requests a contacts:me channel response', () => {
		expect(electron.ipcRenderer.send).toHaveBeenCalledWith('contacts:me');
	});

	it('returns myself from getMyself() after receiving info from the contacts:me channel', () => {
		let myself = {
			name: 'My Name',
			address: 'my@address.fr'
		};
		channels['contacts:me'](null, myself);
		expect(service.getMyself()).toEqual(myself);
	});
});
