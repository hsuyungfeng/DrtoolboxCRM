import { Repository, DataSource } from 'typeorm';
import { RevenueAdjustment } from '../entities/revenue-adjustment.entity';
import { RevenueRecord } from '../entities/revenue-record.entity';
import { CreateRevenueAdjustmentDto } from '../dto/create-revenue-adjustment.dto';
import { UpdateRevenueAdjustmentDto } from '../dto/update-revenue-adjustment.dto';
import { StaffService } from '../../staff/services/staff.service';
export declare class RevenueAdjustmentService {
    private readonly adjustmentRepo;
    private readonly recordRepo;
    private readonly dataSource;
    private readonly staffService;
    constructor(adjustmentRepo: Repository<RevenueAdjustment>, recordRepo: Repository<RevenueRecord>, dataSource: DataSource, staffService: StaffService);
    create(createDto: CreateRevenueAdjustmentDto, clinicId: string): Promise<RevenueAdjustment>;
    findAll(clinicId: string, filters?: {
        revenueRecordId?: string;
        createdBy?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<RevenueAdjustment[]>;
    findOne(id: string, clinicId: string): Promise<RevenueAdjustment>;
    update(id: string, updateDto: UpdateRevenueAdjustmentDto, clinicId: string): Promise<RevenueAdjustment>;
    remove(id: string, clinicId: string): Promise<void>;
    review(id: string, clinicId: string, reviewData: {
        status: 'approved' | 'rejected';
        notes?: string;
        reviewedBy: string;
    }): Promise<RevenueAdjustment>;
    findByRevenueRecordId(revenueRecordId: string, clinicId: string): Promise<RevenueAdjustment[]>;
    getTotalAdjustmentAmount(revenueRecordId: string, clinicId: string): Promise<number>;
}
