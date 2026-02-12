import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RevenueRecord } from "../entities/revenue-record.entity";
import { RevenueCalculatorService } from "./revenue-calculator.service";

@Injectable()
export class RevenueRecordService {
  constructor(
    @InjectRepository(RevenueRecord)
    private revenueRecordRepository: Repository<RevenueRecord>,
    private revenueCalculatorService: RevenueCalculatorService,
  ) {}

  async findAll(clinicId: string): Promise<RevenueRecord[]> {
    return await this.revenueRecordRepository.find({
      where: { clinicId },
      order: { calculatedAt: "DESC" },
      relations: ["treatment", "treatmentSession", "staff"],
    });
  }

  async findByTreatment(
    treatmentId: string,
    clinicId: string,
  ): Promise<RevenueRecord[]> {
    return await this.revenueRecordRepository.find({
      where: { treatmentId, clinicId },
      order: { calculatedAt: "DESC" },
      relations: ["treatment", "treatmentSession", "staff"],
    });
  }

  async findByStaff(
    staffId: string,
    clinicId: string,
  ): Promise<RevenueRecord[]> {
    return await this.revenueRecordRepository.find({
      where: { staffId, clinicId },
      order: { calculatedAt: "DESC" },
      relations: ["treatment", "treatmentSession", "staff"],
    });
  }

  async findOne(id: string): Promise<RevenueRecord> {
    const record = await this.revenueRecordRepository.findOne({
      where: { id },
      relations: ["treatment", "treatmentSession", "staff"],
    });

    if (!record) {
      throw new NotFoundException(`RevenueRecord with ID ${id} not found`);
    }

    return record;
  }

  async lockRecord(id: string): Promise<RevenueRecord> {
    const record = await this.findOne(id);

    if (record.lockedAt) {
      throw new Error(
        `RevenueRecord ${id} is already locked at ${record.lockedAt}`,
      );
    }

    record.lockedAt = new Date();
    record.status = "locked";
    return await this.revenueRecordRepository.save(record);
  }

  async unlockRecord(id: string): Promise<RevenueRecord> {
    const record = await this.findOne(id);

    record.lockedAt = null;
    record.status = "calculated";
    return await this.revenueRecordRepository.save(record);
  }

  async markAsPaid(id: string, paidAt?: Date): Promise<RevenueRecord> {
    const record = await this.findOne(id);

    record.paidAt = paidAt || new Date();
    record.status = "paid";
    return await this.revenueRecordRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);

    // 已鎖定的記錄不能刪除
    if (record.lockedAt) {
      throw new BadRequestException(
        `無法刪除已鎖定的分潤記錄（鎖定時間：${record.lockedAt.toISOString()}）`,
      );
    }

    // 已支付的記錄不能刪除
    if (record.paidAt) {
      throw new BadRequestException(
        `無法刪除已支付的分潤記錄（支付時間：${record.paidAt.toISOString()}）`,
      );
    }

    // 軟刪除：標記為 cancelled
    record.status = "cancelled";
    await this.revenueRecordRepository.save(record);
  }

  async calculateForTreatment(
    treatmentId: string,
    clinicId: string,
  ): Promise<RevenueRecord[]> {
    return await this.revenueCalculatorService.calculateAndCreateRecords({
      treatmentId,
      clinicId,
      calculationDate: new Date(),
    });
  }

  async calculateForSession(
    treatmentId: string,
    sessionId: string,
    clinicId: string,
  ): Promise<RevenueRecord[]> {
    return await this.revenueCalculatorService.calculateAndCreateRecords({
      treatmentId,
      sessionId,
      clinicId,
      calculationDate: new Date(),
    });
  }

  async getSummaryByClinic(
    clinicId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const query = this.revenueRecordRepository
      .createQueryBuilder("record")
      .where("record.clinicId = :clinicId", { clinicId })
      .andWhere("record.status IN (:...statuses)", {
        statuses: ["calculated", "locked", "paid"],
      });

    if (startDate) {
      query.andWhere("record.calculatedAt >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("record.calculatedAt <= :endDate", { endDate });
    }

    const [records, totalAmount] = await Promise.all([
      query.getMany(),
      query.select("SUM(record.amount)", "total").getRawOne(),
    ]);

    const summaryByRole = await query
      .select("record.role, SUM(record.amount) as total, COUNT(*) as count")
      .groupBy("record.role")
      .getRawMany();

    const summaryByStaff = await query
      .select(
        "record.staffId, staff.name, SUM(record.amount) as total, COUNT(*) as count",
      )
      .leftJoin("record.staff", "staff")
      .groupBy("record.staffId, staff.name")
      .getRawMany();

    return {
      totalRecords: records.length,
      totalAmount: totalAmount.total || 0,
      byRole: summaryByRole,
      byStaff: summaryByStaff,
    };
  }
}
