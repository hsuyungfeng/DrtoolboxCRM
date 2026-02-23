import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface CreateAuditLogDto {
  userId: string;
  userName?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  clinicId: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQueryDto {
  clinicId: string;
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new AuditLog();
    auditLog.userId = createDto.userId;
    auditLog.userName = createDto.userName ?? null;
    auditLog.action = createDto.action;
    auditLog.entityType = createDto.entityType ?? null;
    auditLog.entityId = createDto.entityId ?? null;
    auditLog.oldValue = createDto.oldValue ? JSON.stringify(createDto.oldValue) : null;
    auditLog.newValue = createDto.newValue ? JSON.stringify(createDto.newValue) : null;
    auditLog.clinicId = createDto.clinicId;
    auditLog.description = createDto.description ?? null;
    auditLog.ipAddress = createDto.ipAddress ?? null;
    auditLog.userAgent = createDto.userAgent ?? null;

    const saved = await this.auditLogRepository.save(auditLog);
    this.logger.log(`Audit log created: ${saved.action} on ${saved.entityType}:${saved.entityId}`);
    return saved;
  }

  async findAll(query: AuditLogQueryDto): Promise<{ data: AuditLog[]; total: number }> {
    const { clinicId, userId, action, entityType, entityId, startDate, endDate, page = 1, limit = 20 } = query;

    const whereConditions: any = { clinicId };

    if (userId) whereConditions.userId = userId;
    if (action) whereConditions.action = action;
    if (entityType) whereConditions.entityType = entityType;
    if (entityId) whereConditions.entityId = entityId;

    if (startDate && endDate) {
      whereConditions.createdAt = Between(startDate, endDate);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string, clinicId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId, clinicId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  logAction(
    userId: string,
    action: AuditAction,
    clinicId: string,
    options?: {
      userName?: string;
      entityType?: string;
      entityId?: string;
      oldValue?: Record<string, any>;
      newValue?: Record<string, any>;
      description?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return this.create({
      userId,
      action,
      clinicId,
      userName: options?.userName,
      entityType: options?.entityType,
      entityId: options?.entityId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      description: options?.description,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
  }
}
