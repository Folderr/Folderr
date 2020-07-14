
/**
 * @classdesc General location for RegExps to be used within Folderrs API
 */
class RegExpList {
    readonly email: RegExp;

    readonly password: RegExp;

    readonly username: RegExp;

    readonly url: RegExp;

    constructor() {
        this.email = /([A-Za-z0-9_.\-$%#!+/=^;&'*]{2,})?@[a-z0-9$-_.+!*’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
        this.password = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])[#?!@$%^&*-_[\]].{8,32}$/;
        this.username = /[a-z0-9_]{3,12}/;
        this.url = /http(s)?:\/\/[a-z0-9$-_.!’(,;:@&=/]{2,}\.[a-z]{2,}(.[a-z]{2,})?/;
    }
}

export default RegExpList;
