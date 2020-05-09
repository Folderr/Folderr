export class DBClass {
    constructor() {
        if (this.constructor.name === 'DBClass') {
            throw Error('DBClass is abstract! You may not use it directly!');
        }
    }
    async init(...args) {
        throw new Error('DB > NOT IMPLEMENTED - Method init is not implemented!');
    }
    async createFolderr() {
        throw new Error('DB > NOT IMPLEMENTED - Method createFolderr is not implemented!');
    }
    async addFolderrBan(email) {
        throw new Error('DB > NOT IMPLEMENTED - Method addFolderrBan is not implemented!');
    }
    async fetchFolderr(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method fetchFolderr is not implemented!');
    }
    async removeFolderrBan(email) {
        throw new Error('DB > NOT IMPLEMENTED - Method removeFolderrBan is not implemented!');
    }
    async makeOwner(username, password, userID, email) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeOwner is not implemented!');
    }
    async findUser(query, selector) {
        throw new Error('DB > NOT IMPLEMENTED - Method findUser is not implemented!');
    }
    async findUsers(query, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method findUsers is not implemented!');
    }
    async findFullUser(query, selectors) {
        throw new Error('DB > NOT IMPLEMENTED - Method findFullUser is not implemented!');
    }
    async findAndUpdateUser(query, update, selector) {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndUpdateUser is not implemented!');
    }
    async updateUser(query, update) {
        throw new Error('DB > NOT IMPLEMENTED - Method updateUser is not implemented!');
    }
    async makeUser(username, userID, password, email, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeUser is not implemented!');
    }
    async purgeUser(userID) {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeUser is not implemented!');
    }
    async findVerify(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findVerify is not implemented!');
    }
    async findVerifies(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findVerifies is not implemented!');
    }
    async verifyUser(userID, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method verifyUser is not implemented!');
    }
    async verifySelf(userID) {
        throw new Error('DB > NOT IMPLEMENTED - Method verifySelf is not implemented!');
    }
    async denyUser(userID) {
        throw new Error('DB > NOT IMPLEMENTED - Method denyUser is not implemented!');
    }
    async denySelf(userID) {
        throw new Error('DB > NOT IMPLEMENTED - Method verifySelf is not implemented!');
    }
    async makeVerify(userID, username, password, validationToken, email) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeVerify is not implemented!');
    }
    async findFile(query, selector) {
        throw new Error('DB > NOT IMPLEMENTED - Method findFile is not implemented!');
    }
    async findAndDeleteFile(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndDeleteFile is not implemented!');
    }
    async findFiles(query, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method findFiles is not implemented!');
    }
    async updateFile(query, update) {
        throw new Error('DB > NOT IMPLEMENTED - Method updateFile is not implemented!');
    }
    async makeFile(id, owner, path, type) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeFile is not implemented!');
    }
    async purgeFile(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeFile is not implemented!');
    }
    async findLink(query, selector) {
        throw new Error('DB > NOT IMPLEMENTED - Method findLink is not implemented!');
    }
    async findLinks(query, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method findLinks is not implemented!');
    }
    async findAndDeleteLink(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findAndDeleteLink is not implemented!');
    }
    async updateLink(query, update) {
        throw new Error('DB > NOT IMPLEMENTED - Method updateLink is not implemented!');
    }
    async makeLink(id, owner, link) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeFile is not implemented!');
    }
    async purgeLink(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeLink is not implemented!');
    }
    async findToken(tokenID, userID, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method findToken is not implemented!');
    }
    async findTokens(userID, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method findTokens is not implemented!');
    }
    async makeToken(tokenID, userID, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method addToken is not implemented!');
    }
    async purgeToken(tokenID, userID, options) {
        throw new Error('DB > NOT IMPLEMENTED - Method addTokens is not implemented!');
    }
    async purgeTokens(userID, web) {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeTokens is not implemented!');
    }
    async makeAdminNotify(id, notify, title) {
        throw new Error('DB > NOT IMPLEMENTED - Method makeAdminNotify is not implemented!');
    }
    async findAdminNotify(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findAdminNotify is not implemented!');
    }
    async findAdminNotifies(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method findAdminNotifies is not implemented!');
    }
    async purgeAdminNotify(query) {
        throw new Error('DB > NOT IMPLEMENTED - Method purgeAdminNotify is not implemented!');
    }
}
export default DBClass;
