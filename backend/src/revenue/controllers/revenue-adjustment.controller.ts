import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RevenueAdjustmentService } from '../services/revenue-adjustment.service';
import { CreateRevenueAdjustmentDto } from '../dto/create-revenue-adjustment.dto';
import { UpdateRevenueAdjustmentDto } from '../dto/update-revenue-adjustment.dto';
import { RevenueAdjustment } from '../entities/revenue-adjustment.entity';

@ApiTags('分潤調整')
@ApiBearerAuth()
@Controller('revenue-adjustments')
export class RevenueAdjustmentController {
  constructor(private readonly adjustmentService: RevenueAdjustmentService) {}

  @Post()
  @ApiOperation({ summary: '創建分潤調整' })
  @ApiResponse({ status: 201, description: '分潤調整創建成功', type: RevenueAdjustment })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '分潤記錄不存在' })
  async create(
    @Body() createDto: CreateRevenueAdjustmentDto,
    @Query('clinicId') clinicId: string,
  ): Promise<RevenueAdjustment> {
    return this.adjustmentService.create(createDto, clinicId);
  }

  @Get()
  @ApiOperation({ summary: '查詢所有分潤調整' })
  @ApiResponse({ status: 200, description: '返回分潤調整列表', type: [RevenueAdjustment] })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  @ApiQuery({ name: 'revenueRecordId', required: false, description: '分潤記錄 ID' })
  @ApiQuery({ name: 'createdBy', required: false, description: '創建者 ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '開始日期 (ISO 格式)' })
  @ApiQuery({ name: 'endDate', required: false, description: '結束日期 (ISO 格式)' })
  async findAll(
    @Query('clinicId') clinicId: string,
    @Query('revenueRecordId') revenueRecordId?: string,
    @Query('createdBy') createdBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueAdjustment[]> {
    const filters: any = {};
    if (revenueRecordId) filters.revenueRecordId = revenueRecordId;
    if (createdBy) filters.createdBy = createdBy;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    return this.adjustmentService.findAll(clinicId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '查詢單個分潤調整' })
  @ApiResponse({ status: 200, description: '返回分潤調整詳情', type: RevenueAdjustment })
  @ApiResponse({ status: 404, description: '分潤調整不存在' })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async findOne(
    @Param('id') id: string,
    @Query('clinicId') clinicId: string,
  ): Promise<RevenueAdjustment> {
    return this.adjustmentService.findOne(id, clinicId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分潤調整（主要用於審核）' })
  @ApiResponse({ status: 200, description: '分潤調整更新成功', type: RevenueAdjustment })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 404, description: '分潤調整不存在' })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRevenueAdjustmentDto,
    @Query('clinicId') clinicId: string,
  ): Promise<RevenueAdjustment> {
    return this.adjustmentService.update(id, updateDto, clinicId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除分潤調整' })
  @ApiResponse({ status: 200, description: '分潤調整刪除成功' })
  @ApiResponse({ status: 400, description: '分潤調整已審核通過，無法刪除' })
  @ApiResponse({ status: 404, description: '分潤調整不存在' })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async remove(
    @Param('id') id: string,
    @Query('clinicId') clinicId: string,
  ): Promise<void> {
    return this.adjustmentService.remove(id, clinicId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: '審核分潤調整' })
  @ApiResponse({ status: 200, description: '審核成功', type: RevenueAdjustment })
  @ApiResponse({ status: 400, description: '分潤調整已審核過' })
  @ApiResponse({ status: 404, description: '分潤調整不存在' })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async review(
    @Param('id') id: string,
    @Query('clinicId') clinicId: string,
    @Body() reviewData: {
      status: 'approved' | 'rejected';
      notes?: string;
      reviewedBy: string;
    },
  ): Promise<RevenueAdjustment> {
    return this.adjustmentService.review(id, clinicId, reviewData);
  }

  @Get('revenue-record/:revenueRecordId')
  @ApiOperation({ summary: '查詢指定分潤記錄的所有調整' })
  @ApiResponse({ status: 200, description: '返回分潤調整列表', type: [RevenueAdjustment] })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async findByRevenueRecordId(
    @Param('revenueRecordId') revenueRecordId: string,
    @Query('clinicId') clinicId: string,
  ): Promise<RevenueAdjustment[]> {
    return this.adjustmentService.findByRevenueRecordId(revenueRecordId, clinicId);
  }

  @Get('revenue-record/:revenueRecordId/total-adjustment')
  @ApiOperation({ summary: '計算分潤記錄的總調整金額' })
  @ApiResponse({ status: 200, description: '返回總調整金額' })
  @ApiQuery({ name: 'clinicId', required: true, description: '診所 ID' })
  async getTotalAdjustmentAmount(
    @Param('revenueRecordId') revenueRecordId: string,
    @Query('clinicId') clinicId: string,
  ): Promise<{ total: number }> {
    const total = await this.adjustmentService.getTotalAdjustmentAmount(revenueRecordId, clinicId);
    return { total };
  }
}