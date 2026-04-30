import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PatientService } from '../services/patient.service';
import { PatientSearchService } from '../services/patient-search.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { ClinicScoped } from '../../common/decorators/clinic-scoped.decorator';

/**
 * 患者 API 控制器
 */
@ApiBearerAuth()
@ApiTags('Patients')
@Controller('patients')
@ClinicScoped()
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientSearchService: PatientSearchService,
  ) {}

  /**
   * 搜尋患者
   */
  @Get('search')
  @ApiOperation({ summary: '搜尋患者' })
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
    return { statusCode: 200, data: patients, count: patients.length };
  }

  /**
   * 驗證患者身份
   */
  @Get('identify')
  @ApiOperation({ summary: '雙重驗證患者身份' })
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
    return { statusCode: 200, data: patient };
  }

  /**
   * 取得患者詳情
   * 重要：:id 路由必須放在特定路徑（如 search, identify）之後
   */
  @Get(':id')
  @ApiOperation({ summary: '取得患者詳情' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const patient = await this.patientSearchService.getPatientProfile(id, req.clinicId);
    return { statusCode: 200, data: patient };
  }

  /**
   * 建立患者
   */
  @Post()
  @ApiOperation({ summary: '建立新患者' })
  async create(@Body() dto: CreatePatientDto, @Req() req: any) {
    const patient = await this.patientService.createPatient(dto, req.clinicId);
    return { statusCode: 201, message: '患者已建立', data: patient };
  }

  /**
   * 更新患者資料 (同時支援 PUT 和 PATCH)
   */
  @Put(':id')
  @ApiOperation({ summary: '更新患者資料 (PUT)' })
  async updatePut(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: any) {
    const patient = await this.patientService.updatePatient(id, dto, req.clinicId);
    return { statusCode: 200, message: '患者資料已更新', data: patient };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新患者資料 (PATCH)' })
  async updatePatch(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: any) {
    return this.updatePut(id, dto, req);
  }

  /**
   * 列舉診所患者 (分頁)
   * 重要：不帶參數的 Get 必須放在最後或最前面，取決於路徑設計
   */
  @Get()
  @ApiOperation({ summary: '分頁列舉診所患者' })
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
      pagination: { page: result.page, pageSize: result.pageSize, total: result.total },
    };
  }
}
