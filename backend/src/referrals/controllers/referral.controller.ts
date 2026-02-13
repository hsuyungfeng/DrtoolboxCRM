import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ReferralService, ReferralStats } from "../services/referral.service";
import { Referral } from "../entities/referral.entity";
import { CreateReferralDto } from "../dto/create-referral.dto";
import { ConvertReferralDto } from "../dto/convert-referral.dto";

/**
 * ReferralController - 推薦 REST API
 */
@Controller("referrals")
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * POST /referrals - 創建推薦記錄
   */
  @Post()
  async create(
    @Body() createReferralDto: CreateReferralDto,
    @Request() req: any,
  ): Promise<Referral> {
    // 驗證診所 ID 一致性
    const clinicId = req.user?.clinicId || req.body?.clinicId;
    this.validateClinicId(createReferralDto.clinicId, clinicId);

    return await this.referralService.createReferral(createReferralDto);
  }

  /**
   * GET /referrals/by-referrer/:referrerId/:referrerType
   * 按推薦人查詢推薦記錄
   */
  @Get("by-referrer/:referrerId/:referrerType")
  async getReferralsByReferrer(
    @Param("referrerId") referrerId: string,
    @Param("referrerType") referrerType: string,
    @Request() req: any,
  ): Promise<Referral[]> {
    const clinicId = req.user?.clinicId;
    return await this.referralService.getReferralsByReferrer(
      referrerId,
      referrerType,
      clinicId,
    );
  }

  /**
   * GET /referrals/by-patient/:patientId
   * 按患者查詢推薦記錄
   */
  @Get("by-patient/:patientId")
  async getReferralByPatient(
    @Param("patientId") patientId: string,
    @Request() req: any,
  ): Promise<Referral | null> {
    const clinicId = req.user?.clinicId;
    return await this.referralService.getReferralByPatient(patientId, clinicId);
  }

  /**
   * PUT /referrals/:id/convert
   * 轉化推薦（標記為已轉化並獎勵點數）
   */
  @Put(":id/convert")
  async convert(
    @Param("id") id: string,
    @Body() convertReferralDto: ConvertReferralDto,
    @Request() req: any,
  ): Promise<Referral> {
    const clinicId = req.user?.clinicId;
    // 驗證診所 ID 一致性
    this.validateClinicId(convertReferralDto.clinicId, clinicId);

    return await this.referralService.convertReferral(
      id,
      convertReferralDto.treatmentId,
      clinicId,
    );
  }

  /**
   * DELETE /referrals/:id
   * 取消推薦
   */
  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Request() req: any,
  ): Promise<Referral> {
    const clinicId = req.user?.clinicId;
    return await this.referralService.deleteReferral(id, clinicId);
  }

  /**
   * GET /referrals/stats
   * 獲取推薦統計數據
   */
  @Get("stats")
  async getStats(@Request() req: any): Promise<ReferralStats> {
    const clinicId = req.user?.clinicId;
    return await this.referralService.getReferralStats(clinicId);
  }

  /**
   * 驗證診所 ID 一致性
   * @throws BadRequestException 如果診所 ID 不匹配
   */
  private validateClinicId(dtoClinicId: string, userClinicId: string): void {
    if (dtoClinicId !== userClinicId) {
      throw new BadRequestException("診所 ID 不匹配，無權限操作其他診所的數據");
    }
  }
}
