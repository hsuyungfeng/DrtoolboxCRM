import { RevenueAdjustmentService } from "../services/revenue-adjustment.service";
import { CreateRevenueAdjustmentDto } from "../dto/create-revenue-adjustment.dto";
import { UpdateRevenueAdjustmentDto } from "../dto/update-revenue-adjustment.dto";
import { RevenueAdjustment } from "../entities/revenue-adjustment.entity";
export declare class RevenueAdjustmentController {
    private readonly adjustmentService;
    constructor(adjustmentService: RevenueAdjustmentService);
    create(createDto: CreateRevenueAdjustmentDto, clinicId: string): Promise<RevenueAdjustment>;
    findAll(clinicId: string, revenueRecordId?: string, createdBy?: string, startDate?: string, endDate?: string): Promise<RevenueAdjustment[]>;
    findOne(id: string, clinicId: string): Promise<RevenueAdjustment>;
    update(id: string, updateDto: UpdateRevenueAdjustmentDto, clinicId: string): Promise<RevenueAdjustment>;
    remove(id: string, clinicId: string): Promise<void>;
    review(id: string, clinicId: string, reviewData: {
        status: "approved" | "rejected";
        notes?: string;
        reviewedBy: string;
    }): Promise<RevenueAdjustment>;
    findByRevenueRecordId(revenueRecordId: string, clinicId: string): Promise<RevenueAdjustment[]>;
    getTotalAdjustmentAmount(revenueRecordId: string, clinicId: string): Promise<{
        total: number;
    }>;
}
