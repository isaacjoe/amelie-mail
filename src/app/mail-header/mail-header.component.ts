import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'app-mail-header',
	templateUrl: './mail-header.component.html',
	styleUrls: ['./mail-header.component.css']
})
export class MailHeaderComponent implements OnInit {
	@Input() mail: any;

	constructor() {
	}

	ngOnInit() {
	}

	// TODO should refactor to make this dry (move to Mail)
	private getFromDisplayNames() {
		if (!this.mail.from || !this.mail.from.length) {
			return 'Unknown';
		} else {
			return this.mail.from.map(from => from.name || from.address || 'Unknown').join(', ');
		}
	}

	// TODO should refactor to make this dry (move to Mail)
	private getToDisplayNames() {
		let recipients = (this.mail.to || []).concat(this.mail.cc || []);

		if (!recipients.length) {
			return '';
		} else {
			return recipients.map(to => to.name || to.address || 'Unknown').join(', ');
		}
	}
}