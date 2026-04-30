import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: '建立新線索' })
  create(@Request() req, @Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(req.user.clinicId, createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: '獲取所有線索' })
  findAll(@Request() req) {
    return this.leadsService.findAll(req.user.clinicId);
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取特定線索詳情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.leadsService.findOne(req.user.clinicId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新線索資訊' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(req.user.clinicId, id, updateLeadDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新線索狀態' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.leadsService.updateStatus(req.user.clinicId, id, status);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: '將線索轉化為病患' })
  convert(
    @Request() req,
    @Param('id') id: string,
    @Body('idNumber') idNumber: string,
  ) {
    return this.leadsService.convertToPatient(req.user.clinicId, id, idNumber);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除線索' })
  remove(@Request() req, @Param('id') id: string) {
    return this.leadsService.remove(req.user.clinicId, id);
  }
}
