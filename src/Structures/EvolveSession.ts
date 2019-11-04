/* eslint no-magic-numbers: "off"*/
/* eslint @typescript-eslint/ban-ts-ignore: "off" */
import crypto from 'crypto';

export interface Options {
    bytes?: number;
    expiresAfter?: number;
}

export interface CookieReturns {
    cookieID: string;
    maxAge: Date;
}

class EvolveSession implements Options {
    public bytes: number;

    public sessions: Map<string, object>;

    public expiresAfter: number;

    constructor(options?: Options) {
        this.bytes = options && options.bytes ? options.bytes : 32;
        this.sessions = new Map();
        this.expiresAfter = options && options.expiresAfter && !Number.isNaN(options.expiresAfter) ? options.expiresAfter : 86400000;
    }

    setCookie(res: any): CookieReturns {
        const cookieID = this.generateID();
        res.cookie('sid', cookieID, { secure: false, sameSite: 'Strict', maxAge: this.expiresAfter, path: '/' } );
        return { cookieID, maxAge: new Date(Date.now() + this.expiresAfter) };
    }

    generateID(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    newSession(data: object, req: any, res: any): void {
        if (req.cookies && req.cookies.sid && this.sessions.get(req.cookies.sid) ) {
            return;
        }
        const cookie = this.setCookie(res);
        const d = data;
        // @ts-ignore
        d.expires = cookie.maxAge;
        // @ts-ignore
        d.sid = cookie.cookieID;
        this.sessions.set(cookie.cookieID, d);
    }

    removeData(sid: string): void {
        if (!this.sessions.get(sid) ) {
            return;
        }
        this.sessions.delete(sid);
    }

    removeSession(req: any, res: any): void {
        if (!req.cookies || !req.cookies.sid) {
            return;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return;
        }
        res.clearCookie('sid', { secure: false, sameSite: 'Strict', path: '/' } );
        // @ts-ignore
        this.removeData(data.sid);
    }

    removeIfNeeded(req: any, res: any): void {
        if (!req.cookies || !req.cookies.sid) {
            return;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return;
        }
        // @ts-ignore
        if (new Date() > data.expires) {
            this.removeSession(req, res);
        }
    }

    fetchSession(req: any): any {
        if (!req.cookies || !req.cookies.sid) {
            return false;
        }
        const data = this.sessions.get(req.cookies.sid);
        if (!data) {
            return false;
        }
        return data;
    }
}

export default EvolveSession;
