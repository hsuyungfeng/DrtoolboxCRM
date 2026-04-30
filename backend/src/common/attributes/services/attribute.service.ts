import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinition, AttributeTarget, AttributeType } from '../entities/attribute-definition.entity';
import { CreateAttributeDto, UpdateAttributeDto } from '../dto/attribute.dto';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(AttributeDefinition)
    private attributeRepo: Repository<AttributeDefinition>,
  ) {}

  async findAll(clinicId: string, targetEntity?: AttributeTarget): Promise<AttributeDefinition[]> {
    const query = this.attributeRepo.find({
      where: {
        clinicId,
        ...(targetEntity ? { targetEntity } : {}),
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
    return query;
  }

  async findOne(clinicId: string, id: string): Promise<AttributeDefinition> {
    const attribute = await this.attributeRepo.findOne({
      where: { id, clinicId },
    });
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }
    return attribute;
  }

  async create(clinicId: string, dto: CreateAttributeDto): Promise<AttributeDefinition> {
    const attribute = this.attributeRepo.create({
      ...dto,
      clinicId,
    });
    return this.attributeRepo.save(attribute);
  }

  async update(clinicId: string, id: string, dto: UpdateAttributeDto): Promise<AttributeDefinition> {
    const attribute = await this.findOne(clinicId, id);
    Object.assign(attribute, dto);
    return this.attributeRepo.save(attribute);
  }

  async remove(clinicId: string, id: string): Promise<void> {
    const attribute = await this.findOne(clinicId, id);
    await this.attributeRepo.remove(attribute);
  }

  async validateCustomFields(
    clinicId: string,
    targetEntity: AttributeTarget,
    customFields: Record<string, any>,
  ): Promise<void> {
    if (!customFields) return;

    const definitions = await this.findAll(clinicId, targetEntity);
    
    for (const def of definitions) {
      const value = customFields[def.name];

      // Check if required
      if (def.isRequired && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Custom field "${def.label}" is required`);
      }

      // Type validation (basic)
      if (value !== undefined && value !== null && value !== '') {
        switch (def.type) {
          case AttributeType.NUMBER:
            if (typeof value !== 'number' && isNaN(Number(value))) {
              throw new BadRequestException(`Custom field "${def.label}" must be a number`);
            }
            break;
          case AttributeType.DATE:
            if (isNaN(Date.parse(value))) {
              throw new BadRequestException(`Custom field "${def.label}" must be a valid date`);
            }
            break;
          case AttributeType.SELECT:
            if (def.options && !def.options.includes(value)) {
              throw new BadRequestException(`Invalid value for custom field "${def.label}"`);
            }
            break;
          case AttributeType.MULTISELECT:
            if (!Array.isArray(value)) {
              throw new BadRequestException(`Custom field "${def.label}" must be an array`);
            }
            if (def.options && Array.isArray(def.options)) {
              const options = def.options as string[];
              const invalidOptions = value.filter(v => !options.includes(v));
              if (invalidOptions.length > 0) {
                throw new BadRequestException(`Invalid options selected for "${def.label}": ${invalidOptions.join(', ')}`);
              }
            }
            break;
          case AttributeType.DATERANGE:
            if (!Array.isArray(value) || value.length !== 2 || isNaN(Date.parse(value[0])) || isNaN(Date.parse(value[1]))) {
              throw new BadRequestException(`Custom field "${def.label}" must be a valid date range (array of 2 dates)`);
            }
            break;
          case AttributeType.FILE:
            // Basic check: string (URL/path) or object with URL
            if (typeof value !== 'string' && (!value.url || typeof value.url !== 'string')) {
              throw new BadRequestException(`Custom field "${def.label}" must be a valid file reference`);
            }
            break;
        }
      }
    }
  }
}
