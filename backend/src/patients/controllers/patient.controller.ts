import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClinicContextGuard } from '../../common/guards/clinic-context.guard';
import { PatientService } from '../services/patient.service';
import { PatientSearchService } from '../services/patient-search.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';

/**
 * 患者 API 控制器
 *
 * 端點：
 * - GET  /api/patients/search?keyword=xxx    搜尋患者
 * - GET  /api/patients/identify?idNumber=xxx&name=xxx  雙重驗證患者
 * - GET  /api/patients/:id                   取得患者詳情
 * - POST /api/patients                       建立患者
 * - PATCH /api/patients/:id                  編輯患者
 * - GET  /api/patients                       分頁列舉患者
 *
 * 多租戶隔離：所有端點均透過 ClinicContextGuard 確保診所隔離
 */
@ApiBearerAuth()
@ApiTags('Patients')
@Controller('api/patients')
@UseGuards(ClinicContextGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientSearchService: PatientSearchService,
  ) {}

  /**
   * 搜尋患者
   * GET /api/patients/search?keyword=xxx
   */
  @Get('search')
  @ApiOperation({ summary: '搜尋患者（關鍵字匹配身份證ID或姓名）' })
  @ApiQuery({ name: 'keyword', description: '搜尋關鍵字' })
  @ApiQuery({ name: 'limit', required: false, description: '回傳筆數上限（預設 20）' })
  async search(
    @Query('keyword') keyword: string,
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    const patients = await this.patientSearchService.searchPatients(
      keyword,
      req.clinicId,
      Number(limit),
    );

    return {
      statusCode: 200,
      data: patients,
      count: patients.length,
    };
  }

  /**
   * 驗證患者身份（身份證ID + 姓名雙重驗證）
   * GET /api/patients/identify?idNumber=xxx&name=xxx
   */
  @Get('identify')
  @ApiOperation({ summary: '雙重驗證患者身份（身份證ID + 姓名）' })
  @ApiQuery({ name: 'idNumber', description: '身份證號碼' })
  @ApiQuery({ name: 'name', description: '患者姓名' })
  async identify(
    @Query('idNumber') idNumber: string,
    @Query('name') name: string,
    @Req() req: any,
  ) {
    const patient = await this.patientSearchService.identifyPatientByIdAndName(
      idNumber,
      name,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: patient,
    };
  }

  /**
   * 取得患者詳情（含療程）
   * GET /api/patients/:id
   */
  @Get(':id')
  @ApiOperation({ summary: '取得患者詳情（含療程紀錄）' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const patient = await this.patientSearchService.getPatientProfile(
      id,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: patient,
    };
  }

  /**
   * 建立患者
   * POST /api/patients
   */
  @Post()
  @ApiOperation({ summary: '建立新患者' })
  async create(
    @Body() dto: CreatePatientDto,
    @Req() req: any,
  ) {
    const patient = await this.patientService.createPatient(
      dto,
      req.clinicId,
    );

    return {
      statusCode: 201,
      message: '患者已建立',
      data: patient,
    };
  }

  /**
   * 編輯患者資料
   * PATCH /api/patients/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新患者資料' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @Req() req: any,
  ) {
    const patient = await this.patientService.updatePatient(
      id,
      dto,
      req.clinicId,
    );

    return {
      statusCode: 200,
      message: '患者資料已更新',
      data: patient,
    };
  }

  /**
   * 列舉診所患者（分頁）
   * GET /api/patients?page=1&pageSize=20
   */
  @Get()
  @ApiOperation({ summary: '分頁列舉診所患者' })
  @ApiQuery({ name: 'page', required: false, description: '頁數（預設 1）' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每頁筆數（預設 20）' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Req() req: any,
  ) {
    const result = await this.patientSearchService.getClinicPatients(
      req.clinicId,
      Number(page),
      Number(pageSize),
    );

    return {
      statusCode: 200,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      },
    };
  }
}
