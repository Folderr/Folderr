// HTTP status codes we use

const codes = {
    ok: 200,
    created: 201,
    noContent: 204,
    partialContent: 206,
    used: 226,
    badReq: 400,
    unauth: 401,
    forbidden: 403,
    notFound: 404,
    locked: 423,
    tooManyReq: 429,
    internalErr: 500,
};

export interface Codes {
    ok: number;
    created: number;
    noContent: number;
    partialContent: number;
    used: number;
    badReq: number;
    unauth: number;
    forbidden: number;
    notFound: number;
    locked: number;
    tooManyReq: number;
    internalErr: number;
}

export default codes;
