/**
 * @license
 *
 * Evolve-X is an open source image host. https://gitlab.com/evolve-x
 * Copyright (C) 2019 VoidNulll
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

/**
 * @author VoidNulll
 * @version 0.8.0
 */

import { EventEmitter } from 'events';
import Base from './Base';

interface RBase {
    date: Date;
    ip: string;
}

interface Req extends RBase{
    num: number;
}

interface PrevBans {
    num: number;
    ip: string;
}

/**
 *
 * @author VoidNulll
 * @class Ratelimiter
 * @classdesc Handles ratelimits for Evolve-X
 * @extends EventEmitter
 *
 */
export default class Ratelimiter extends EventEmitter {
    public base: Base;

    public reqs: Map<string, Req>;

    public bans: Map<string, RBase>;

    public prevBans: Map<string, PrevBans>;

    public readonly rules: { firstTime: number; maxTime: number; secondTime: number; max: number };

    /**
     * @param {Base} base Base client for Evolve-X
     *
     * @property {Base} base The base client
     * @property {Map<String, Req>} reqs Map of requests based on IP
     * @property {Map<String, RBase>} bans Map of bans, based on IP
     * @property {Object} rules The rules for the Ratelimiter to abide by.
     */
    constructor(base: Base) {
        super();
        this.base = base;

        this.reqs = new Map();
        this.bans = new Map();
        this.prevBans = new Map();

        this.rules = {
            max: 6,
            maxTime: 3600000,
            firstTime: 300000,
            secondTime: 1800000,
        };
    }

    /**
     * Check if a IP is banned
     * @param {String} ip The IP to check for
     * @returns Boolean
     */
    isBanned(ip: string): boolean {
        const ban = this.bans.get(ip);
        if (!ban) {
            return false;
        }
        if (ban.date > new Date() ) {
            return true;
        }
        this.removeBan(ip);
        return false;
    }

    /**
     * Fetch how many requests an IP has
     * @param ip The IP to fetch
     * @returns Number
     */
    getReq(ip: string): boolean|number {
        const req = this.reqs.get(ip);
        if (!req) {
            return false;
        }
        if (req.date > new Date() ) {
            return req.num;
        }
        this.removeReq(ip);
        return false;
    }

    /**
     * Add a request to the limiter
     * @param {String} ip The IP to add
     * @returns Number
     */
    addReq(ip: string): number {
        const req = this.reqs.get(ip);
        let num;
        const sec = 2500;
        if (!req) {
            this.reqs.set(ip, { ip, date: new Date(Date.now() + sec), num: 1 } );
            num = 1;
        } else {
            this.reqs.set(ip, { ip, date: req.date, num: req.num + 1 } );
            num = req.num + 1;
        }
        return num;
    }

    /**
     * Removes a request based on IP
     * @param {String} ip IP to remove
     * @returns Boolean
     */
    removeReq(ip: string): boolean {
        return this.reqs.delete(ip);
    }

    /**
     * Fetch the total times an IP has been banned
     * @param ip
     * @returns Boolean|Number
     */
    getBanCount(ip: string): boolean|number {
        const ban = this.prevBans.get(ip);
        if (!ban) {
            return false;
        }
        return ban.num >= 3 ? 3 : ban.num;
    }

    /**
     * Adds a ban
     * @param {String} ip The IP you are banning
     * @returns Boolean
     */
    addBan(ip: string): boolean {
        if (!this.getReq(ip) ) {
            return false;
        }
        this.reqs.delete(ip);
        const prevs = this.prevBans.get(ip);
        let time;
        if (!prevs || !prevs.num) {
            this.prevBans.set(ip, { num: 1, ip } );
            time = new Date(Date.now() + this.rules.firstTime);
            this.bans.set(ip, { date: time, ip } );
        } else {
            // If you are banned the first time
            let str = 'secondTime';
            if (prevs.num === 3 || prevs.num > 3) { // If you got banned twice, have a hour ban
                str = 'maxTime';
            }
            // Set accurate times.
            this.prevBans.set(ip, { num: prevs.num + 1, ip } );
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            time = new Date(Date.now() + this.rules[str] );
            this.bans.set(ip, { date: time, ip } );
        }
        return true;
    }

    /**
     * Removes a ban
     * @param {String} ip The IP you are unbanning
     * @returns Boolean
     */
    removeBan(ip: string): boolean {
        return this.bans.delete(ip);
    }
}
