import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Payment } from '../revenue/entities/payment.entity';
import { TreatmentCourse } from '../treatments/entities/treatment-course.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(TreatmentCourse)
    private readonly treatmentCourseRepository: Repository<TreatmentCourse>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 根據自定義屬性分析患者分佈
   * 例如：皮膚類型、興趣、過敏史等
   */
  async getAttributeDistribution(clinicId: string, attributeKey: string) {
    // 使用 PostgreSQL JSONB 查詢 (如果支援) 或 TypeORM QueryBuilder
    // 注意：SQLite 不支援 JSONB，這裡提供相容邏輯
    const query = this.dataSource.createQueryBuilder(Patient, 'patient')
      .select(`json_extract(patient.customFields, '$.${attributeKey}')`, 'value')
      .addSelect('COUNT(*)', 'count')
      .where('patient.clinicId = :clinicId', { clinicId })
      .andWhere(`json_extract(patient.customFields, '$.${attributeKey}') IS NOT NULL`)
      .groupBy('value');
    
    // 如果是 Postgres，語法會不同
    if (this.dataSource.options.type === 'postgres') {
      return await this.patientRepository
        .createQueryBuilder('patient')
        .select(`patient.customFields->>'${attributeKey}'`, 'value')
        .addSelect('COUNT(*)', 'count')
        .where('patient.clinicId = :clinicId', { clinicId })
        .andWhere(`patient.customFields ? '${attributeKey}'`)
        .groupBy('value')
        .getRawMany();
    }

    return await query.getRawMany();
  }

  /**
   * 營收預測：基於歷史數據與當前活躍療程
   */
  async getRevenueForecast(clinicId: string) {
    // 1. 獲取過去三個月的平均月營收
    const historicalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("SUM(payment.amount)", "total")
      .where('payment.clinicId = :clinicId', { clinicId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .andWhere("payment.paidAt >= date('now', '-3 months')")
      .getRawOne();

    // 2. 獲取當前所有進行中療程的剩餘未付金額 (預估)
    // 這裡簡化為：療程總價 - 已付總額
    const activeCoursesValue = await this.treatmentCourseRepository
      .createQueryBuilder('course')
      .select("SUM(course.totalPrice)", "total")
      .where('course.clinicId = :clinicId', { clinicId })
      .andWhere('course.status = :status', { status: 'active' })
      .getRawOne();

    return {
      averageMonthlyRevenue: parseFloat(historicalRevenue?.total || '0') / 3,
      potentialActiveRevenue: parseFloat(activeCoursesValue?.total || '0'),
      forecastNextMonth: parseFloat(historicalRevenue?.total || '0') / 3 * 1.1, // 簡單預測增長 10%
    };
  }
}
