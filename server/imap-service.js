'use strict';

const Mail = require('./mail');
const codec = require('emailjs-mime-codec');

const rx = require('rxjs/Observable');
require('rxjs/add/observable/of');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/fromEvent');
require('rxjs/add/observable/fromEventPattern');
require('rxjs/add/observable/merge');
require('rxjs/add/observable/throw');
require('rxjs/add/operator/catch');
require('rxjs/add/operator/merge');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/observable/bindNodeCallback');

class ImapService {
	constructor(accountSettingsService, Client, codec) {
		this.Client = Client;
		this.codec = codec;
		this.accountSettingsService = accountSettingsService;
	}

	listen() {
		return this.accountSettingsService.getAll()
			.flatMap(accountSettings => {
				this.client = new this.Client(accountSettings.host, accountSettings.port, accountSettings.options);
				this.client.logLevel = this.client.LOG_LEVEL_INFO;
				return this.connectAndStart().merge(this._listen());
			})
			.map(messages => {
				return messages.map(message => {
					return new Mail()
						.withUid(message.uid)
						.withMessageId(message.envelope['message-id'])
						.withSubject(message.envelope.subject)
						.withFrom(message.envelope.from || [])
						.withTo(message.envelope.to || [])
						.withBody(message.body)
						.withBodyType(message.bodyType)
						.withPreview(message.preview)
						.withIsSeen(message.flags && message.flags.indexOf('\\Seen') >= 0)
				})
			});
	}

	_listen() {
		return rx.Observable.fromEventPattern(
			handler => {
				this.client.onupdate = handler;
			},
			() => {
				this.client.onpudate = null;
			},
			(path, type, value) => ({
				path: path,
				type: type,
				value: value
			})
		).map(updateInfo => {
			if (updateInfo.type === 'exists') {
				let sequenceStr = this.inboxInfo.exists + ':' + updateInfo.value;
				this.inboxInfo.exists = updateInfo.value;
				return this._load(sequenceStr);
			} else {
				return [];
			}
		});
	}

	get(uid) {
		return this.client.listMessages('INBOX', uid, ['BODY[]'], {
			byUid: true
		}).then(m => {
			return m;
		});
	}

	/* private */
	connectAndStart() {
		return rx.Observable.fromPromise(
			this.client.connect()
			.then(() => this.client.selectMailbox('INBOX'))
			.then(inboxInfo => {
				this.inboxInfo = inboxInfo;
				return inboxInfo;
			})
		).map(inboxInfo => {
			console.log(inboxInfo);
			let last1oo = inboxInfo.exists - 8;
			console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>. asdfasdf');
			return this._load(last1oo + ':*');
		});
	}

	_load(sequenceStr) {
		console.log('>>>>>>>>>>>>>>>>>>>>>> LOAD', sequenceStr);
		return rx.Observable.fromPromise(
			this.client.listMessages('INBOX', sequenceStr, ['uid', 'flags', 'envelope', 'bodystructure'])
			.then(messages => this.addBodies(messages, 'text/plain'))
			.then(messages => this.addBodies(messages, 'text/html'))
		).map(mess => {
			console.log('GOT MESS', mess.length);
			return mess;
		})
	}

	/* private */
	addBodies(messages, partType) {
		console.log('>>>> ADDB');
		let plainTextPartMap = this.getPartCodeMap(messages, partType);
		let promises = plainTextPartMap.map(partInfo => {
			return this.client.listMessages('INBOX', partInfo.uidList, ['uid', `body.peek[${partInfo.part}]`], {
				byUid: true
			}).then(bodyMessages => {
				bodyMessages.forEach(bodyMessage => {
					let message = messages.filter(it => it.uid === bodyMessage.uid)[0];

					if (message) {
						let part = this.getPart(message.bodystructure, partType);
						let bodyEncoded = bodyMessage[`body[${partInfo.part}]`];
						let bodyDecoded = this.decode(bodyEncoded, part.encoding, (part.parameters || {}).charset);
						message.body = bodyDecoded;
						message.bodyType = partType;

						if (partType === 'text/plain') {
							message.preview = message.body.substr(0, 200);
						}
					}
				});
			});
		});
		return Promise.all(promises).then(() => {
			console.log('DONE', messages);
			return messages;
		});
	}

	decode(bodyEncoded, encoding, charset) {
		if (encoding === 'quoted-printable') {
			return codec.quotedPrintableDecode(bodyEncoded, charset);
		} else if (encoding === 'base64') {
			return codec.base64Decode(bodyEncoded, charset);
		} else {
			return bodyEncoded;
		}
	}

	/* private */
	getPartCodeMap(messages, partType) {
		let map = {};
		messages.forEach(message => {
			let part = this.getPart(message.bodystructure, partType);
			if (part !== undefined) {
				let partCode = part.part || '1';
				map[partCode] = map[partCode] || [];
				map[partCode].push(message.uid);
			}
		});
		return Object.keys(map).map(part => {
			return {
				part: part,
				uidList: map[part].join(',') // TODO compress the uids in a:b formats?
			};
		});
	}

	/* private */
	getPart(structure, partType) {
		if (structure.type === partType) {
			return structure;
		}

		if (structure.childNodes) {
			for (let i = 0; i < structure.childNodes.length; i++) {
				let childPart = this.getPart(structure.childNodes[i], partType);
				if (childPart !== undefined) {
					return childPart;
				}
			}
		}
	}
}

module.exports = ImapService;
module.exports['@singleton'] = true;
module.exports['@require'] = ['account-settings-service', 'emailjs-imap-client', 'emailjs-mime-codec'];
