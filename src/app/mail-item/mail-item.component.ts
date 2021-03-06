import { Component, Input } from '@angular/core';
import { AppStateService } from '../shared/app-state.service';

@Component({
	selector: 'app-mail-item',
	templateUrl: './mail-item.component.html',
	styleUrls: ['./mail-item.component.css'],
	host: {
		'[class.unseen]': '!mail.isSeen',
		'[class.active]': 'isActive()'
	}
})
export class MailItemComponent {
	@Input()
	public mail: any;

	constructor(private appStateService: AppStateService) {
	}

	private getFromDisplayNames() {
		if (!this.mail.from || !this.mail.from.length) {
			return 'Unknown';
		} else {
			return this.mail.from.map(from => from.name || from.address || 'Unknown').join(', ');
		}
	}

	private isActive(): boolean {
		return this.appStateService.getActiveMail() === this.mail;
	}
}
