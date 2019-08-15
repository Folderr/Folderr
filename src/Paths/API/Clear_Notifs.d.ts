import Path from '../../Structures/Path';
import Base from "../../Structures/Base";
import Evolve from "../../Structures/Evolve";
import { Request, Response } from "express";
declare class ClearNotifs extends Path {
    constructor(evolve: Evolve, base: Base);
    execute(req: Request, res: Response): Promise<Response>;
}
export default ClearNotifs;
