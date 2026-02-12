import { CreateRevenueAdjustmentDto } from './create-revenue-adjustment.dto';
declare const UpdateRevenueAdjustmentDto_base: import("@nestjs/common").Type<Partial<CreateRevenueAdjustmentDto>>;
export declare class UpdateRevenueAdjustmentDto extends UpdateRevenueAdjustmentDto_base {
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
}
export {};
