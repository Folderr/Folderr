import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
    cookies: Record<string, unknown>;
    uauth: boolean;
}
