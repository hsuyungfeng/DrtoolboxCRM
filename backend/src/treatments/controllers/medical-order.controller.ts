/**
 * 醫令控制器（Medical Order Controller）
 * 提供完整的醫令 REST API 端點
 * 所有端點均需認證並通過 ClinicContextGuard 進行多租戶隔離
 *
 * API 端點：
 * - POST   /api/medical-orders         - 建立醫令
 * - GET    /api/medical-orders/:id     - 取得醫令詳情
 * - PATCH  /api/medical-orders/:id     - 更新醫令（含狀態轉換）
 * - DELETE /api/medical-orders/:id     - 取消醫令
 * - POST   /api/medical-orders/:id/use - 記錄使用進度
 * - GET    /api/medical-orders/patients/:patientId - 取得患者所有醫令
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClinicContextGuard } from '../../common/guards/clinic-context.guard';
import { MedicalOrderService } from '../services/medical-order.service';
import { CreateMedicalOrderDto } from '../dto/create-medical-order.dto';
import { UpdateMedicalOrderDto } from '../dto/update-medical-order.dto';

/**
 * 標準化 API 響應介面
 */
interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
  count?: number;
}

import { ClinicScoped } from '../../common/decorators/clinic-scoped.decorator';

@ApiBearerAuth()
@ApiTags('醫令管理 Medical Orders')
@Controller('medical-orders')
@ClinicScoped()
export class MedicalOrderController {
  constructor(private readonly medicalOrderService: MedicalOrderService) {}

  /**
   * 建立新醫令
   * POST /api/medical-orders
   * 從 JWT token 取得開立醫師 ID，從 ClinicContextGuard 取得診所 ID
   */
  @ApiOperation({ summary: '建立新醫令', description: '醫師建立新的醫令，支援從模板快速建立' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMedicalOrderDto,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const prescribedBy = req.user.id;
    const clinicId = req.user.clinicId;

    const order = await this.medicalOrderService.createMedicalOrder(
      dto,
      prescribedBy,
      clinicId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '醫令已建立',
      data: order,
    };
  }

  /**
   * 取得患者的所有醫令列表
   * GET /api/medical-orders/patients/:patientId
   * 注意：此路由必須在 :id 路由之前定義，避免路由衝突
   */
  @ApiOperation({ summary: '取得患者所有醫令', description: '查詢指定患者的醫令列表，支援狀態過濾' })
  @ApiQuery({ name: 'status', required: false, description: '狀態過濾：pending | in_progress | completed | cancelled' })
  @Get('patients/:patientId')
  async getPatientOrders(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
    @Req() req?: any,
  ): Promise<ApiResponse<any[]>> {
    const clinicId = req.user.clinicId;

    const orders = await this.medicalOrderService.getPatientMedicalOrders(
      patientId,
      clinicId,
      status,
    );

    return {
      statusCode: HttpStatus.OK,
      data: orders,
      count: orders.length,
    };
  }

  /**
   * 取得醫令詳情
   * GET /api/medical-orders/:id
   */
  @ApiOperation({ summary: '取得醫令詳情', description: '依 ID 查詢醫令詳情，包含關聯患者及開立醫師資訊' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const clinicId = req.user.clinicId;
    const order = await this.medicalOrderService.getMedicalOrder(id, clinicId);

    return {
      statusCode: HttpStatus.OK,
      data: order,
    };
  }

  /**
   * 更新醫令
   * PATCH /api/medical-orders/:id
   * 支援狀態轉換和欄位更新
   */
  @ApiOperation({ summary: '更新醫令', description: '更新醫令資訊或進行狀態轉換（pending→in_progress→completed/cancelled）' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalOrderDto,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const clinicId = req.user.clinicId;

    const order = await this.medicalOrderService.updateMedicalOrder(
      id,
      dto,
      clinicId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '醫令已更新',
      data: order,
    };
  }

  /**
   * 記錄醫令使用進度
   * POST /api/medical-orders/:id/use
   * 增量更新使用次數，自動觸發狀態轉換
   */
  @ApiOperation({ summary: '記錄醫令使用進度', description: '增量記錄本次使用次數，自動觸發 pending→in_progress→completed 狀態轉換' })
  @Post(':id/use')
  async recordUsage(
    @Param('id') id: string,
    @Body() body: { usedCount: number },
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const clinicId = req.user.clinicId;

    const order = await this.medicalOrderService.recordMedicalOrderUsage(
      id,
      clinicId,
      body.usedCount,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '使用進度已記錄',
      data: order,
    };
  }

  /**
   * 取消醫令
   * DELETE /api/medical-orders/:id
   * 將醫令標記為已取消（軟刪除），不可刪除已完成的醫令
   */
  @ApiOperation({ summary: '取消醫令', description: '將醫令標記為已取消，已完成的醫令不能取消' })
  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponse<any>> {
    const clinicId = req.user.clinicId;

    const order = await this.medicalOrderService.cancelMedicalOrder(
      id,
      clinicId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '醫令已取消',
      data: order,
    };
  }
}
