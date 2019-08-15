import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import { Document } from "mongoose";
import { Request, Response } from "express";
interface notification {
    title: string;
    notify: string;
    ID: string;
}
interface IUser extends Document {
    uID: string;
    password: string;
    token: string;
    first?: boolean;
    username: string;
    admin?: boolean;
    notifs?: notification[];
}
interface updReturns {
    code: number;
    mess: string;
}
declare class UpdateAcc extends Path {
    private keys;
    constructor(evolve: Evolve, base: Base);
    updateUsername(user: IUser, name: string): Promise<updReturns>;
    updatePassword(user: IUser, pass: string): Promise<updReturns>;
    execute(req: Request, res: Response): Promise<Response>;
}
export default UpdateAcc;
