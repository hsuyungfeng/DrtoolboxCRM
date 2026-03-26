/**
 * 醫令服務（Medical Order Service）
 * 負責醫令的完整 CRUD 操作和狀態機管理
 * 支援多租戶隔離、狀態轉換驗證、使用進度追蹤
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalOrder, MedicalOrderStatus } from '../entities/medical-order.entity';
import { ScriptTemplate } from '../entities/script-template.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { CreateMedicalOrderDto } from '../dto/create-medical-order.dto';
import { UpdateMedicalOrderDto } from '../dto/update-medical-order.dto';

/**
 * 狀態轉換規則
 * pending → in_progress / cancelled
 * in_progress → completed / cancelled
 * completed / cancelled → 終態，不可再轉換
 */
type ValidTransitions = {
  [key in MedicalOrderStatus]: MedicalOrderStatus[];
};

@Injectable()
export class MedicalOrderService {
  private readonly logger = new Logger(MedicalOrderService.name);

  /** 定義有效的狀態轉換規則 */
  private readonly validTransitions: ValidTransitions = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  constructor(
    @InjectRepository(MedicalOrder)
    private readonly medicalOrderRepository: Repository<MedicalOrder>,
    @InjectRepository(ScriptTemplate)
    private readonly scriptTemplateRepository: Repository<ScriptTemplate>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * 建立新醫令
   * 驗證患者存在且屬於該診所
   * 支援從模板複製預設值快速建立
   *
   * @param dto 建立醫令 DTO
   * @param prescribedBy 開立醫師/醫護人員 ID（從 JWT 取得）
   * @param clinicId 診所 ID（多租戶隔離）
   * @returns 新建立的醫令
   */
  async createMedicalOrder(
    dto: CreateMedicalOrderDto,
    prescribedBy: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    // 驗證患者存在且屬於該診所
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId, clinicId },
    });
    if (!patient) {
      throw new NotFoundException('患者不存在或不屬於此診所');
    }

    // 建立醫令資料物件（英文欄位）
    let drugOrTreatmentName = dto.drugOrTreatmentName;
    let dosage = dto.dosage;
    let usageMethod = dto.usageMethod;
    let totalSessions = dto.totalSessions;

    // 如果提供了模板 ID，從模板複製預設值（DTO 欄位優先）
    if (dto.scriptTemplateId) {
      const template = await this.scriptTemplateRepository.findOne({
        where: { id: dto.scriptTemplateId, clinicId },
      });
      if (!template) {
        throw new NotFoundException('醫令模板不存在或不屬於此診所');
      }

      // 使用模板的預設值（但 DTO 欄位優先）
      dosage = dto.dosage || template.defaultDosage;
      usageMethod = dto.usageMethod || template.defaultUsageMethod;
      totalSessions = dto.totalSessions || template.defaultTotalSessions;
    }

    // 驗證療程數必須 > 0
    if (!totalSessions || totalSessions <= 0) {
      throw new BadRequestException('療程數必須大於 0');
    }

    const medicalOrder = this.medicalOrderRepository.create({
      clinicId,
      patientId: dto.patientId,
      prescribedBy,
      drugOrTreatmentName,
      description: dto.description,
      dosage,
      usageMethod,
      totalSessions,
      completedSessions: 0,
      status: 'pending',
      startedAt: null,
      completedAt: null,
    });

    const saved = await this.medicalOrderRepository.save(medicalOrder);

    this.logger.log(
      `成功建立醫令 - orderId: ${saved.id}, patientId: ${dto.patientId}, clinicId: ${clinicId}`,
    );

    return saved;
  }

  /**
   * 取得醫令詳情
   * 包含關聯患者和開立醫師資訊
   *
   * @param orderId 醫令 ID
   * @param clinicId 診所 ID（多租戶隔離）
   * @returns 醫令詳情
   */
  async getMedicalOrder(
    orderId: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.medicalOrderRepository.findOne({
      where: { id: orderId, clinicId },
      relations: ['patient', 'prescriber'],
    });

    if (!order) {
      throw new NotFoundException('醫令不存在');
    }

    return order;
  }

  /**
   * 更新醫令（含狀態轉換）
   * 驗證狀態轉換有效性，狀態轉換時記錄時間戳
   *
   * @param orderId 醫令 ID
   * @param dto 更新醫令 DTO
   * @param clinicId 診所 ID（多租戶隔離）
   * @returns 更新後的醫令
   */
  async updateMedicalOrder(
    orderId: string,
    dto: UpdateMedicalOrderDto,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    // 如果要轉換狀態，驗證轉換有效性
    if (dto.status && dto.status !== order.status) {
      if (!this.validTransitions[order.status].includes(dto.status)) {
        throw new BadRequestException(
          `無法從 ${order.status} 轉換到 ${dto.status}，不符合狀態轉換規則`,
        );
      }

      // 狀態轉換時設定時間戳
      if (dto.status === 'in_progress') {
        order.startedAt = order.startedAt || new Date();
      } else if (dto.status === 'completed') {
        order.completedAt = new Date();
      }

      order.status = dto.status;
    }

    // 更新其他欄位（僅更新有提供的欄位）
    if (dto.drugOrTreatmentName) order.drugOrTreatmentName = dto.drugOrTreatmentName;
    if (dto.description !== undefined) order.description = dto.description;
    if (dto.dosage) order.dosage = dto.dosage;
    if (dto.usageMethod) order.usageMethod = dto.usageMethod;
    if (dto.totalSessions) order.totalSessions = dto.totalSessions;

    if (typeof dto.completedSessions === 'number') {
      // 驗證已使用數不超過療程數
      if (dto.completedSessions > order.totalSessions) {
        throw new BadRequestException('已使用數不能超過總療程數');
      }
      order.completedSessions = dto.completedSessions;
    }

    const saved = await this.medicalOrderRepository.save(order);

    this.logger.log(
      `成功更新醫令 - orderId: ${orderId}, clinicId: ${clinicId}`,
    );

    return saved;
  }

  /**
   * 取得患者的所有醫令（含狀態過濾）
   * 按創建時間降序排列
   *
   * @param patientId 患者 ID
   * @param clinicId 診所 ID（多租戶隔離）
   * @param status 狀態過濾（選填）
   * @returns 醫令陣列
   */
  async getPatientMedicalOrders(
    patientId: string,
    clinicId: string,
    status?: string,
  ): Promise<MedicalOrder[]> {
    const query = this.medicalOrderRepository
      .createQueryBuilder('mo')
      .where('mo.patientId = :patientId', { patientId })
      .andWhere('mo.clinicId = :clinicId', { clinicId });

    if (status) {
      query.andWhere('mo.status = :status', { status });
    }

    const orders = await query.orderBy('mo.createdAt', 'DESC').getMany();

    this.logger.log(
      `查詢患者醫令 - patientId: ${patientId}, clinicId: ${clinicId}, count: ${orders.length}`,
    );

    return orders;
  }

  /**
   * 取消醫令（標記為已取消）
   * 已完成或已取消的醫令不能再取消
   *
   * @param orderId 醫令 ID
   * @param clinicId 診所 ID（多租戶隔離）
   * @returns 已取消的醫令
   */
  async cancelMedicalOrder(
    orderId: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    if (order.status === 'completed') {
      throw new BadRequestException('已完成的醫令不能取消');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('醫令已取消');
    }

    order.status = 'cancelled';
    const saved = await this.medicalOrderRepository.save(order);

    this.logger.log(
      `成功取消醫令 - orderId: ${orderId}, clinicId: ${clinicId}`,
    );

    return saved;
  }

  /**
   * 記錄醫令使用進度（增量更新）
   * 自動狀態轉換：
   *   - 首次使用時 pending → in_progress
   *   - 全部完成時 → completed
   *
   * @param orderId 醫令 ID
   * @param clinicId 診所 ID（多租戶隔離）
   * @param usedCount 本次使用次數（增量）
   * @returns 更新後的醫令
   */
  async recordMedicalOrderUsage(
    orderId: string,
    clinicId: string,
    usedCount: number,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    if (order.status === 'cancelled' || order.status === 'completed') {
      throw new BadRequestException(`${order.status} 狀態的醫令無法更新使用進度`);
    }

    const remaining = order.totalSessions - order.completedSessions;
    if (usedCount > remaining) {
      throw new BadRequestException(
        `使用次數（${usedCount}）超過剩餘療程數（${remaining}）`,
      );
    }

    // 首次使用時自動從 pending 轉換到 in_progress
    if (order.status === 'pending' && usedCount > 0) {
      order.status = 'in_progress';
      order.startedAt = new Date();
    }

    order.completedSessions += usedCount;

    // 全部使用完自動標記為完成
    if (order.completedSessions >= order.totalSessions) {
      order.status = 'completed';
      order.completedAt = new Date();
    }

    const saved = await this.medicalOrderRepository.save(order);

    this.logger.log(
      `成功記錄醫令使用進度 - orderId: ${orderId}, usedCount: ${usedCount}, total: ${order.completedSessions}/${order.totalSessions}`,
    );

    return saved;
  }

  /**
   * 計算醫令進度百分比
   *
   * @param order 醫令實體
   * @returns 進度百分比（0-100）
   */
  getProgressPercent(order: MedicalOrder): number {
    if (order.totalSessions === 0) return 0;
    return Math.round((order.completedSessions / order.totalSessions) * 100);
  }
}
