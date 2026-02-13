import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentCourseTemplate } from '../entities/treatment-course-template.entity';

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
  async getActiveTemplates(clinicId: string): Promise<TreatmentCourseTemplate[]> {
    return this.templateRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: 'DESC' },
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
   * @param data 模板數據
   * @returns 建立的模板
   */
  async createTemplate(
    data: Partial<TreatmentCourseTemplate>,
  ): Promise<TreatmentCourseTemplate> {
    return this.templateRepository.save(data);
  }

  /**
   * 更新模板
   * 支持多租戶隔離 - 只更新指定診所的模板
   * @param templateId 模板 ID
   * @param clinicId 診所 ID
   * @param data 更新數據
   * @returns 更新後的模板
   */
  async updateTemplate(
    templateId: string,
    clinicId: string,
    data: Partial<TreatmentCourseTemplate>,
  ): Promise<TreatmentCourseTemplate | null> {
    await this.templateRepository.update(
      { id: templateId, clinicId },
      data,
    );
    return this.getTemplateById(templateId, clinicId);
  }

  /**
   * 軟刪除模板
   * 支持多租戶隔離 - 只刪除指定診所的模板
   * @param templateId 模板 ID
   * @param clinicId 診所 ID
   */
  async deleteTemplate(templateId: string, clinicId: string): Promise<void> {
    await this.templateRepository.update(
      { id: templateId, clinicId },
      { isActive: false },
    );
  }
}
