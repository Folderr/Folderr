/**
 * @classdesc General location for RegExps to be used within Folderrs API
 */
class RegExpList {
	readonly email: RegExp;

	readonly password: RegExp;

	readonly username: RegExp;

	readonly url: RegExp;

	readonly gitAheadBehind: RegExp;

	// This is due to the regex making the line have a length of 102. Max is 100
	constructor() {
		this.email =
			/^([\w.\-$%#!+/=^;&'*]{2,})?@[a-z\d$-_.+!*’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?$/;
		// 8 to 256 characters, with a letter (any language) and a symbol, punctuation mark or space.
		// Keep in sync with src/frontend/src/utils/regexs.ts
		this.password = /^(?=.*\p{L})(?=.*[\p{M}\p{Z}\p{P}\p{S}]).{8,256}$/u;
		this.username = /\w{3,16}/;
		this.url =
			/http(s)?:\/\/[a-z\d$-_.!’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
		this.gitAheadBehind = /ahead \d+|behind \d+/g;
	}
}

export default RegExpList;
