import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TreatmentCourseTemplate } from "../entities/treatment-course-template.entity";
import Decimal from "decimal.js";

/**
 * 療程課程模板服務
 * 負責管理和查詢療程課程模板
 * 提供多租戶隔離的模板管理功能
 */
@Injectable()
export class TreatmentCourseTemplateService {
  constructor(
    @InjectRepository(TreatmentCourseTemplate)
    private readonly templateRepository: Repository<TreatmentCourseTemplate>,
  ) {}

  /**
   * 查詢診所所有活躍模板
   * @param clinicId 診所 ID
   * @returns 活躍模板列表（按建立時間降序排列）
   */
  async getActiveTemplates(
    clinicId: string,
  ): Promise<TreatmentCourseTemplate[]> {
    return this.templateRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 按 ID 查詢模板
   * 支持多租戶隔離 - 只返回指定診所的模板
   * @param templateId 模板 ID
   * @param clinicId 診所 ID
   * @returns 模板物件或 null（如果不存在）
   */
  async getTemplateById(
    templateId: string,
    clinicId: string,
  ): Promise<TreatmentCourseTemplate | null> {
    return this.templateRepository.findOne({
      where: { id: templateId, clinicId },
    });
  }

  /**
   * 創建新模板
   * 驗證必要字段並創建新的治療課程模板
   * @param data 模板數據
   * @returns 建立的模板
   * @throws BadRequestException 當必要字段缺失或數據無效時
   */
  async createTemplate(
    data: Partial<TreatmentCourseTemplate>,
  ): Promise<TreatmentCourseTemplate> {
    // 驗證必要字段
    if (!data.clinicId || data.clinicId.trim() === "") {
      throw new BadRequestException("診所 ID (clinicId) 不能為空");
    }

    if (!data.name || data.name.trim() === "") {
      throw new BadRequestException("模板名稱 (name) 不能為空");
    }

    if (!data.totalSessions || data.totalSessions <= 0) {
      throw new BadRequestException("總療程次數 (totalSessions) 必須大於 0");
    }

    if (
      !data.totalPrice ||
      (data.totalPrice instanceof Decimal
        ? data.totalPrice.isZero() || data.totalPrice.isNegative()
        : Number(data.totalPrice) <= 0)
    ) {
      throw new BadRequestException("套餐價格 (totalPrice) 必須大於 0");
    }

    if (
      !data.stageConfig ||
      !Array.isArray(data.stageConfig) ||
      data.stageConfig.length === 0
    ) {
      throw new BadRequestException("階段配置 (stageConfig) 不能為空");
    }

    try {
      return await this.templateRepository.save(data);
    } catch (error) {
      throw new BadRequestException(
        `創建模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
      );
    }
  }

  /**
   * 更新模板
   * 支持多租戶隔離 - 只更新指定診所的模板
   * 驗證模板存在性並進行異常處理
   * @param templateId 模板 ID
   * @param clinicId 診所 ID
   * @param data 更新數據
   * @returns 更新後的模板
   * @throws BadRequestException 當必要參數缺失時
   * @throws NotFoundException 當模板不存在時
   */
  async updateTemplate(
    templateId: string,
    clinicId: string,
    data: Partial<TreatmentCourseTemplate>,
  ): Promise<TreatmentCourseTemplate> {
    // 驗證必要參數
    if (!templateId || templateId.trim() === "") {
      throw new BadRequestException("模板 ID (templateId) 不能為空");
    }

    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("診所 ID (clinicId) 不能為空");
    }

    // 驗證更新前模板存在
    const existingTemplate = await this.getTemplateById(templateId, clinicId);
    if (!existingTemplate) {
      throw new NotFoundException(
        `模板不存在 (ID: ${templateId}, 診所: ${clinicId})`,
      );
    }

    try {
      const result = await this.templateRepository.update(
        { id: templateId, clinicId },
        data,
      );

      if (result.affected === 0) {
        throw new NotFoundException("模板更新失敗或不存在");
      }

      const updated = await this.getTemplateById(templateId, clinicId);
      if (!updated) {
        throw new NotFoundException("更新後的模板無法檢索");
      }

      return updated;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `更新模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
      );
    }
  }

  /**
   * 軟刪除模板
   * 支持多租戶隔離 - 只刪除指定診所的模板
   * 驗證模板存在性並進行異常處理
   * @param templateId 模板 ID
   * @param clinicId 診所 ID
   * @throws BadRequestException 當必要參數缺失時
   * @throws NotFoundException 當模板不存在時
   */
  async deleteTemplate(templateId: string, clinicId: string): Promise<void> {
    // 驗證必要參數
    if (!templateId || templateId.trim() === "") {
      throw new BadRequestException("模板 ID (templateId) 不能為空");
    }

    if (!clinicId || clinicId.trim() === "") {
      throw new BadRequestException("診所 ID (clinicId) 不能為空");
    }

    // 驗證刪除前模板存在
    const existingTemplate = await this.getTemplateById(templateId, clinicId);
    if (!existingTemplate) {
      throw new NotFoundException(
        `模板不存在 (ID: ${templateId}, 診所: ${clinicId})`,
      );
    }

    try {
      const result = await this.templateRepository.update(
        { id: templateId, clinicId },
        { isActive: false },
      );

      if (result.affected === 0) {
        throw new NotFoundException("模板刪除失敗或不存在");
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `刪除模板失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
      );
    }
  }
}
