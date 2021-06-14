import {
	RateLimiterCluster,
	RateLimiterMemory,
	RateLimiterRes
} from 'rate-limiter-flexible';
import {Request, Response} from 'express';

const tooMany = 429;

/**
 * @fileoverview All of the ratelimiter middleware for express
 */

export abstract class LimiterBase {
	readonly #ratelimiter!: RateLimiterCluster | RateLimiterMemory;

	async consumer(
		request: Request,
		response: Response,
		next: () => any
	): Promise<void> {
		throw new Error('Not implemented!');
	}

	async userConsumer(
		request: Request,
		ressponse: Response,
		next: () => any
	): Promise<void> {
		throw new Error('Not implemented!');
	}
}

export class MemoryLimiter extends LimiterBase {
	readonly #ratelimiter: RateLimiterMemory;

	constructor() {
		super();
		this.#ratelimiter = new RateLimiterMemory({
			points: 10,
			duration: 4
		});
	}

	async consumer(
		request: Request,
		response: Response,
		next: () => any
	): Promise<void> {
		try {
			const ratelimiterResponse = await this.#ratelimiter.consume(
				request.ip,
				2
			);
			response.set(
				'X-Ratelimit-Remaining',
				`${ratelimiterResponse.remainingPoints}`
			);
			next();
		} catch (error: unknown) {
			if (error instanceof RateLimiterRes) {
				response
					.set({
						'Retry-After': error.msBeforeNext / 1000,
						'X-Ratelimit-Remaining': error.remainingPoints
					})
					.status(tooMany)
					.send({code: tooMany, message: 'Too many requests!'});
			}
		}
	}

	async userConsumer(
		request: Request,
		response: Response,
		next: () => any
	): Promise<void> {
		try {
			const ratelimiterResponse = await this.#ratelimiter.consume(
				request.ip,
				1
			);
			response.set(
				'X-Ratelimit-Remaining',
				`${ratelimiterResponse.remainingPoints}`
			);
			next();
		} catch (error: unknown) {
			if (error instanceof RateLimiterRes) {
				response
					.set({
						'Retry-After': error.msBeforeNext / 1000,
						'X-Ratelimit-Remaining': error.remainingPoints
					})
					.status(tooMany)
					.send({code: tooMany, message: 'Too many requests!'});
			}
		}
	}
}
