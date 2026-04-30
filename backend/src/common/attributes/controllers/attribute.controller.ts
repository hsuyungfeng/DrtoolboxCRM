import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttributeService } from '../services/attribute.service';
import { AttributeTarget } from '../entities/attribute-definition.entity';
import { CreateAttributeDto, UpdateAttributeDto } from '../dto/attribute.dto';
import { ClinicScoped } from '../../decorators/clinic-scoped.decorator';

@ApiBearerAuth()
@ApiTags('Attributes')
@Controller('attributes')
@ClinicScoped()
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @Get()
  @ApiOperation({ summary: 'List attribute definitions' })
  async findAll(
    @Req() req: any,
    @Query('targetEntity') targetEntity?: AttributeTarget,
  ) {
    const data = await this.attributeService.findAll(req.clinicId, targetEntity);
    return {
      statusCode: 200,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attribute definition' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const data = await this.attributeService.findOne(req.clinicId, id);
    return {
      statusCode: 200,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create an attribute definition' })
  async create(@Req() req: any, @Body() dto: CreateAttributeDto) {
    const data = await this.attributeService.create(req.clinicId, dto);
    return {
      statusCode: 201,
      message: 'Attribute definition created',
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an attribute definition' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    const data = await this.attributeService.update(req.clinicId, id, dto);
    return {
      statusCode: 200,
      message: 'Attribute definition updated',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attribute definition' })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.attributeService.remove(req.clinicId, id);
    return {
      statusCode: 200,
      message: 'Attribute definition deleted',
    };
  }
}
