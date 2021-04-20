
/**
 * @classdesc General location for RegExps to be used within Folderrs API
 */
class RegExpList {
	readonly email: RegExp;

	readonly password: RegExp;

	readonly username: RegExp;

	readonly url: RegExp;

	readonly gitAheadBehind: RegExp;

	constructor() {
		this.email = /([\w.\-$%#!+/=^;&'*]{2,})?@[a-z\d$-_.+!*’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
		this.password = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,32}$/;
		this.username = /[a-z\d_]{3,12}/;
		this.url = /http(s)?:\/\/[a-z\d$-_.!’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
		this.gitAheadBehind = /ahead \d+|behind \d+/g;
	}
}

export default RegExpList;
