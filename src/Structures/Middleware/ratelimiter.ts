import { RateLimiterCluster, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Request, Response } from 'express';

const tooMany = 429;

export class LimiterBase {
    readonly #ratelimiter!: RateLimiterCluster | RateLimiterMemory

    consumer(req: Request, res: Response, next: () => any): void {
        throw Error('Not implemented!');
    }

    userConsumer(req: Request, res: Response, next: () => any): void {
        throw Error('Not implemented!');
    }
}

export class MemoryLimiter extends LimiterBase {

    readonly #ratelimiter: RateLimiterMemory;

    constructor() {
        super();
        this.#ratelimiter = new RateLimiterMemory( {
            points: 10,
            duration: 4,
        } );
    }

    consumer(req: Request, res: Response, next: () => any) {
        this.#ratelimiter.consume(req.ip, 2)
            .then( (ratelimiterRes: RateLimiterRes) => {
                res.set('X-Ratelimit-Remaining', `${ratelimiterRes.remainingPoints}`);
                next();
            } )
            .catch( (ratelimiterRes: RateLimiterRes) => {
                res.set( {
                    'Retry-After': ratelimiterRes.msBeforeNext / 1000,
                    'X-Ratelimit-Remaining': ratelimiterRes.remainingPoints,
                } ).status(tooMany).send( { code: tooMany, message: 'Too many requests!' } );
            } );
    }

    userConsumer(req: Request, res: Response, next: () => any) {
        this.#ratelimiter.consume(req.ip, 1)
                .then( (ratelimiterRes: RateLimiterRes) => {
                res.set('X-Ratelimit-Remaining', `${ratelimiterRes.remainingPoints}`);
                next();
            } )
            .catch( (ratelimiterRes: RateLimiterRes) => {
                res.set( {
                    'Retry-After': ratelimiterRes.msBeforeNext / 1000,
                    'X-Ratelimit-Remaining': ratelimiterRes.remainingPoints,
                } ).status(tooMany).send( { code: tooMany, message: 'Too many requests!' } );
        } );
    }
}

export class ClusterLimiter extends LimiterBase {

    readonly #ratelimiter: RateLimiterCluster;

    constructor() {
        super()
        this.#ratelimiter = new RateLimiterCluster( {
            points: 10,
            duration: 4,
            execEvenly: true,
            timeoutMs: 5000,
        } );
    }

    consumer(req: Request, res: Response, next: () => any) {
            this.#ratelimiter.consume(req.ip, 2)
                .then( (ratelimiterRes: RateLimiterRes) => {
                    res.set('X-Ratelimit-Remaining', `${ratelimiterRes.remainingPoints}`);
                    next();
                } )
                .catch( (ratelimiterRes: RateLimiterRes) => {
                    res.set( {
                        'Retry-After': ratelimiterRes.msBeforeNext / 1000,
                        'X-Ratelimit-Remaining': ratelimiterRes.remainingPoints,
                    } ).status(tooMany).send( { code: tooMany, message: 'Too many requests!' } );
                } );
    }

    userConsumer(req: Request, res: Response, next: () => any) {
        this.#ratelimiter.consume(req.ip, 1)
                .then( (ratelimiterRes: RateLimiterRes) => {
                res.set('X-Ratelimit-Remaining', `${ratelimiterRes.remainingPoints}`);
                next();
            } )
            .catch( (ratelimiterRes: RateLimiterRes) => {
                res.set( {
                    'Retry-After': ratelimiterRes.msBeforeNext / 1000,
                    'X-Ratelimit-Remaining': ratelimiterRes.remainingPoints,
                } ).status(tooMany).send( { code: tooMany, message: 'Too many requests!' } );
            } );
    }
}