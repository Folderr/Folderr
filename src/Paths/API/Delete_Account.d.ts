import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import { Request, Response } from "express";
interface delReturns {
    code: number;
    mess: string;
}
declare class DelAccount extends Path {
    constructor(evolve: Evolve, base: Base);
    deleteAccount(id: string, username: string): Promise<delReturns>;
    execute(req: Request, res: Response): Promise<Response>;
}
export default DelAccount;
