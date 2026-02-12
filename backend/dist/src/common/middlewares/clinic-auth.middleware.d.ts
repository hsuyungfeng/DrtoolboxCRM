import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
export declare class ClinicAuthMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request, res: Response, next: NextFunction): void;
    private extractClinicIdFromHeader;
    private extractClinicIdFromQuery;
    private extractClinicIdFromBody;
    private isValidClinicId;
    static getClinicIdFromRequest(req: Request): string | null;
}
