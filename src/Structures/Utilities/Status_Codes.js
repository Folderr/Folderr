/**
 * @license
 *
 * Folderr is an open source image host. https://github.com/Folderr
 * Copyright (C) 2020 VoidNulll
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
 * @file HTTP status codes Folderr-X sends.
 */
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
    notAccepted: 406,
    accepted: 202,
    notImplemented: 501,
};
export default codes;
