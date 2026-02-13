import { PointsService } from "../services/points.service";
import { CreatePointsTransactionDto } from "../dto/create-points-transaction.dto";
import { RedeemPointsDto } from "../dto/redeem-points.dto";
import { PointsTransaction } from "../entities/points-transaction.entity";
import { PointsBalance } from "../entities/points-balance.entity";
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    awardPoints(createDto: CreatePointsTransactionDto): Promise<PointsTransaction>;
    redeemPoints(redeemDto: RedeemPointsDto): Promise<PointsTransaction>;
    getBalance(customerId?: string, customerType?: string, clinicId?: string): Promise<PointsBalance>;
    getTransactionHistory(customerId?: string, customerType?: string, clinicId?: string, limit?: string): Promise<PointsTransaction[]>;
}
