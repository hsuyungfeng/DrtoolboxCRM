import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { RevenueAdjustment } from "../entities/revenue-adjustment.entity";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { CreateRevenueAdjustmentDto } from "../dto/create-revenue-adjustment.dto";
import { UpdateRevenueAdjustmentDto } from "../dto/update-revenue-adjustment.dto";
import { StaffService } from "../../staff/services/staff.service";

@Injectable()
export class RevenueAdjustmentService {
  constructor(
    @InjectRepository(RevenueAdjustment)
    private readonly adjustmentRepo: Repository<RevenueAdjustment>,
    @InjectRepository(RevenueRecord)
    private readonly recordRepo: Repository<RevenueRecord>,
    private readonly dataSource: DataSource,
    private readonly staffService: StaffService,
  ) {}

  /**
   * 創建分潤調整
   */
  async create(
    createDto: CreateRevenueAdjustmentDto,
    clinicId: string,
  ): Promise<RevenueAdjustment> {
    // 驗證診所 ID 是否匹配
    if (createDto.clinicId !== clinicId) {
      throw new ForbiddenException("診所 ID 不匹配");
    }

    // 驗證分潤記錄是否存在且屬於同一診所
    const revenueRecord = await this.recordRepo.findOne({
      where: { id: createDto.revenueRecordId, clinicId },
    });
    if (!revenueRecord) {
      throw new NotFoundException("分潤記錄不存在");
    }

    // 驗證分潤記錄是否已鎖定（已鎖定的記錄不能調整）
    if (revenueRecord.lockedAt) {
      throw new BadRequestException("分潤記錄已鎖定，無法調整");
    }

    // 驗證調整金額是否會導致分潤記錄總金額為負數
    const newTotal = revenueRecord.amount + createDto.adjustmentAmount;
    if (newTotal < 0) {
      throw new BadRequestException("調整後分潤金額不能為負數");
    }

    // 創建調整記錄
    const adjustment = this.adjustmentRepo.create({
      ...createDto,
      clinicId,
    });

    // 使用事務保存調整記錄並更新分潤記錄金額
    // 設置 SERIALIZABLE 隔離級別防止併發問題
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      const savedAdjustment = await queryRunner.manager.save(adjustment);

      // 更新分潤記錄金額
      revenueRecord.amount = newTotal;
      revenueRecord.status = "adjusted"; // 更新狀態為已調整
      await queryRunner.manager.save(revenueRecord);

      await queryRunner.commitTransaction();
      return savedAdjustment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`創建調整失敗: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 查詢所有分潤調整
   */
  async findAll(
    clinicId: string,
    filters?: {
      revenueRecordId?: string;
      createdBy?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<RevenueAdjustment[]> {
    const queryBuilder = this.adjustmentRepo
      .createQueryBuilder("adjustment")
      .where("adjustment.clinicId = :clinicId", { clinicId })
      .leftJoinAndSelect("adjustment.revenueRecord", "revenueRecord")
      .orderBy("adjustment.createdAt", "DESC");

    if (filters?.revenueRecordId) {
      queryBuilder.andWhere("adjustment.revenueRecordId = :revenueRecordId", {
        revenueRecordId: filters.revenueRecordId,
      });
    }

    if (filters?.createdBy) {
      queryBuilder.andWhere("adjustment.createdBy = :createdBy", {
        createdBy: filters.createdBy,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere("adjustment.createdAt >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere("adjustment.createdAt <= :endDate", {
        endDate: filters.endDate,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * 查詢單個分潤調整
   */
  async findOne(id: string, clinicId: string): Promise<RevenueAdjustment> {
    const adjustment = await this.adjustmentRepo.findOne({
      where: { id, clinicId },
      relations: ["revenueRecord"],
    });
    if (!adjustment) {
      throw new NotFoundException("分潤調整記錄不存在");
    }
    return adjustment;
  }

  /**
   * 更新分潤調整（主要用於審核）
   */
  async update(
    id: string,
    updateDto: UpdateRevenueAdjustmentDto,
    clinicId: string,
  ): Promise<RevenueAdjustment> {
    const adjustment = await this.findOne(id, clinicId);

    // 如果嘗試更新調整金額，需要重新計算分潤記錄金額
    if (updateDto.adjustmentAmount !== undefined) {
      throw new BadRequestException(
        "不允許直接修改調整金額，請創建新的調整記錄",
      );
    }

    // 更新審核相關字段
    if (updateDto.reviewStatus) {
      adjustment.reviewStatus = updateDto.reviewStatus;
    }
    if (updateDto.reviewNotes) {
      adjustment.reviewNotes = updateDto.reviewNotes;
    }
    if (updateDto.reviewedBy) {
      adjustment.reviewedBy = updateDto.reviewedBy;
    }
    if (updateDto.reviewedAt) {
      adjustment.reviewedAt = new Date(updateDto.reviewedAt);
    }

    // 更新其他允許的字段
    if (updateDto.reason) {
      adjustment.reason = updateDto.reason;
    }
    if (updateDto.metadata) {
      adjustment.metadata = updateDto.metadata;
    }

    return this.adjustmentRepo.save(adjustment);
  }

  /**
   * 刪除分潤調整（僅在審核前允許）
   */
  async remove(id: string, clinicId: string): Promise<void> {
    const adjustment = await this.findOne(id, clinicId);

    // 如果已經審核通過，不允許刪除
    if (adjustment.reviewStatus === "approved") {
      throw new BadRequestException("已審核通過的調整記錄不能刪除");
    }

    // 還原分潤記錄金額
    const revenueRecord = await this.recordRepo.findOne({
      where: { id: adjustment.revenueRecordId, clinicId },
    });
    if (revenueRecord) {
      // 使用事務確保數據一致性
      // 設置 SERIALIZABLE 隔離級別防止併發問題
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction("SERIALIZABLE");

      try {
        // 還原分潤記錄金額
        revenueRecord.amount -= adjustment.adjustmentAmount;
        // 如果調整記錄是最後一個調整，恢復狀態
        const adjustmentCount = await this.adjustmentRepo.count({
          where: { revenueRecordId: adjustment.revenueRecordId, clinicId },
        });
        if (adjustmentCount === 1) {
          revenueRecord.status = "calculated"; // 恢復為已計算狀態
        }
        await queryRunner.manager.save(revenueRecord);

        // 刪除調整記錄
        await queryRunner.manager.remove(adjustment);

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(`刪除調整失敗: ${error.message}`);
      } finally {
        await queryRunner.release();
      }
    } else {
      // 分潤記錄不存在，直接刪除調整記錄
      await this.adjustmentRepo.remove(adjustment);
    }
  }

  /**
   * 審核分潤調整
   */
  async review(
    id: string,
    clinicId: string,
    reviewData: {
      status: "approved" | "rejected";
      notes?: string;
      reviewedBy: string;
    },
  ): Promise<RevenueAdjustment> {
    const adjustment = await this.findOne(id, clinicId);

    // 檢查是否已經審核過
    if (adjustment.reviewStatus) {
      throw new BadRequestException("此調整記錄已經審核過");
    }

    // 更新審核信息
    adjustment.reviewStatus = reviewData.status;
    if (reviewData.notes !== undefined) {
      adjustment.reviewNotes = reviewData.notes;
    }
    adjustment.reviewedBy = reviewData.reviewedBy;
    adjustment.reviewedAt = new Date();

    return this.adjustmentRepo.save(adjustment);
  }

  /**
   * 查詢指定分潤記錄的所有調整
   */
  async findByRevenueRecordId(
    revenueRecordId: string,
    clinicId: string,
  ): Promise<RevenueAdjustment[]> {
    return this.adjustmentRepo.find({
      where: { revenueRecordId, clinicId },
      order: { createdAt: "DESC" },
      relations: ["revenueRecord"],
    });
  }

  /**
   * 計算分潤記錄的總調整金額
   */
  async getTotalAdjustmentAmount(
    revenueRecordId: string,
    clinicId: string,
  ): Promise<number> {
    const result = await this.adjustmentRepo
      .createQueryBuilder("adjustment")
      .select("SUM(adjustment.adjustmentAmount)", "total")
      .where("adjustment.revenueRecordId = :revenueRecordId", {
        revenueRecordId,
      })
      .andWhere("adjustment.clinicId = :clinicId", { clinicId })
      .andWhere("adjustment.reviewStatus = :status", { status: "approved" })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }
}
