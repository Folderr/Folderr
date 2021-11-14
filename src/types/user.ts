import {Notification} from '../backend/Structures/Database/db-class';

export interface AccountReturn {
	username: string;
	id: string;
	admin: boolean;
	owner: boolean;
	files: number;
	links: number;
	customUrls?: string[];
	email: string;
	pendingEmail?: string;
	notifications: Notification[];
	createdAt: number;
}
