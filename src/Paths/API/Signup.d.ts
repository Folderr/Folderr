import Path from '../../Structures/Path';
import Evolve from "../../Structures/Evolve";
import Base from "../../Structures/Base";
import { Request, Response } from "express";
declare class Signup extends Path {
    constructor(evolve: Evolve, base: Base);
    genUID(): Promise<string>;
    execute(req: Request, res: Response): Promise<Response>;
}
export default Signup;
