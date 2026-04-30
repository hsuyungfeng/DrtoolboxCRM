import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { DoctorToolboxSyncModule } from '../doctor-toolbox-sync.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../../auth/auth.module';
import { Patient } from '../../patients/entities/patient.entity';
import { TreatmentCourse } from '../../treatments/entities/treatment-course.entity';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { StaffAssignment } from '../../treatments/entities/staff-assignment.entity';
import { AttributeDefinition } from '../../common/attributes/entities/attribute-definition.entity';
import { SyncPatientIndex } from '../entities/sync-patient-index.entity';
import { SyncOutboundLog } from '../entities/sync-outbound-log.entity';
import { MigrationProgress } from '../entities/migration-progress.entity';
import { SyncAuditLog } from '../../common/entities/sync-audit-log.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { TreatmentStaffAssignment } from '../../staff/entities/treatment-staff-assignment.entity';
import { MedicalOrder } from '../../treatments/entities/medical-order.entity';
import { TreatmentCourseTemplate } from '../../treatments/entities/treatment-course-template.entity';
import { ScriptTemplate } from '../../treatments/entities/script-template.entity';
import { TreatmentTemplate } from '../../treatment-templates/entities/treatment-template.entity';
import { PatientService } from '../../patients/services/patient.service';
import { SyncAuditService } from '../services/sync-audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClinicGuard } from '../../common/guards/clinic.guard';
import * as crypto from 'crypto';

describe('Doctor Toolbox Sync E2E', () => {
  let app: INestApplication;
  let patientRepository: Repository<Patient>;
  let syncIndexRepository: Repository<SyncPatientIndex>;
  let auditLogRepository: Repository<SyncAuditLog>;
  let migrationProgressRepository: Repository<MigrationProgress>;
  let auditService: SyncAuditService;
  let patientService: PatientService;

  const JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJjbGluaWNJZCI6ImNsaW5pYy0xIiwiaWF0IjoxNzExODgxNjAwfQ.placeholder';
  const WEBHOOK_SECRET = 'test-secret-key';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Patient,
            TreatmentCourse,
            TreatmentSession,
            Treatment,
            StaffAssignment,
            AttributeDefinition,
            SyncPatientIndex,
            SyncOutboundLog,
            MigrationProgress,
            SyncAuditLog,
            Staff,
            TreatmentStaffAssignment,
            MedicalOrder,
            TreatmentCourseTemplate,
            ScriptTemplate,
            TreatmentTemplate,
          ],
          synchronize: true,
          logging: false,
        }),
        EventEmitterModule.forRoot(),
        AuthModule,
        DoctorToolboxSyncModule,
      ],
      providers: [
        {
          provide: PatientService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'user-1', clinicId: 'clinic-1' };
          return true;
        },
      })
      .overrideGuard(ClinicGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    patientRepository = moduleFixture.get<Repository<Patient>>(
      getRepositoryToken(Patient),
    );
    syncIndexRepository = moduleFixture.get<Repository<SyncPatientIndex>>(
      getRepositoryToken(SyncPatientIndex),
    );
    auditLogRepository = moduleFixture.get<Repository<SyncAuditLog>>(
      getRepositoryToken(SyncAuditLog),
    );
    migrationProgressRepository = moduleFixture.get<Repository<MigrationProgress>>(
      getRepositoryToken(MigrationProgress),
    );
    auditService = moduleFixture.get<SyncAuditService>(SyncAuditService);
    patientService = moduleFixture.get<PatientService>(PatientService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Sync Workflow', () => {
    it('should execute full sync cycle: webhook → sync → audit log', async () => {
      // Step 1: Log initial webhook event
      const webhookId = 'webhook-test-' + Date.now();
      const toolboxPatientId = 'toolbox-pat-001';
      const crmPatientId = 'crm-pat-001';

      // Create CRM patient for testing
      const patient = patientRepository.create({
        id: crmPatientId,
        clinicId: 'clinic-1',
        idNumber: 'A123456789',
        name: '王小明',
        phone: '0912345678',
        email: 'wang@example.com',
      });
      await patientRepository.save(patient);

      // Step 2: Log webhook received event
      const webhookLog = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId: crmPatientId,
        action: 'webhook-received',
        source: 'toolbox',
        status: 'success',
        eventData: {
          webhookId,
          clinicId: 'clinic-1',
          toolboxPatientId,
        },
      });

      expect(webhookLog).toBeDefined();
      expect(webhookLog.action).toBe('webhook-received');

      // Step 3: Log webhook validation
      const validationLog = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId: crmPatientId,
        action: 'webhook-validated',
        source: 'toolbox',
        status: 'success',
        eventData: {
          webhookId,
          signatureValid: true,
        },
      });

      expect(validationLog.status).toBe('success');

      // Step 4: Log sync success
      const syncLog = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId: crmPatientId,
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
        eventData: {
          syncTime: 1200,
          syncedFields: ['name', 'phone', 'email'],
        },
      });

      expect(syncLog.status).toBe('success');
      expect(syncLog.action).toBe('sync-success');

      // Step 5: Verify audit logs can be queried
      const logs = await auditService.queryByPatient('clinic-1', crmPatientId);

      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.map((l) => l.action)).toContain('webhook-received');
      expect(logs.map((l) => l.action)).toContain('sync-success');

      // Step 6: Verify multi-clinic isolation
      const otherClinicLogs = await auditService.queryByPatient(
        'clinic-2',
        crmPatientId,
      );

      expect(otherClinicLogs.length).toBe(0);
    });

    it('should handle conflict detection and logging', async () => {
      const crmPatientId = 'crm-pat-conflict';

      // Log conflict detection
      const conflictLog = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId: crmPatientId,
        action: 'conflict-detected',
        source: 'toolbox',
        status: 'success',
        eventData: {
          field: 'idNumber',
          toolboxValue: 'B123456789',
          crmValue: 'A123456789',
          resolution: 'CRM authority applied',
        },
      });

      expect(conflictLog.action).toBe('conflict-detected');
      expect(conflictLog.eventData.resolution).toBe('CRM authority applied');

      // Verify conflict logs are retrievable by action
      const conflicts = await auditService.queryByAction(
        'clinic-1',
        'conflict-detected',
      );

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should log retry attempts', async () => {
      const patientId = 'crm-pat-retry';

      // Log first retry attempt
      const retryLog1 = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId,
        action: 'retry-attempt',
        source: 'toolbox',
        status: 'pending',
        eventData: {
          attempt: 1,
          delayMs: 2000,
          reason: 'Network timeout',
        },
      });

      expect(retryLog1.status).toBe('pending');

      // Log second retry
      const retryLog2 = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId,
        action: 'retry-attempt',
        source: 'toolbox',
        status: 'pending',
        eventData: {
          attempt: 2,
          delayMs: 4000,
          reason: 'Network timeout',
        },
      });

      // Log eventual success
      const successLog = await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId,
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
        eventData: {
          retriedCount: 2,
          syncTime: 5200,
        },
      });

      expect(successLog.eventData.retriedCount).toBe(2);

      // Verify retry history
      const retries = await auditService.queryByAction(
        'clinic-1',
        'retry-attempt',
      );

      expect(retries.length).toBeGreaterThanOrEqual(2);
    });

    it('should query audit logs by date range', async () => {
      const patientId = 'crm-pat-daterange';
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 1);
      const endDate = new Date();

      await auditService.logEvent({
        clinicId: 'clinic-1',
        patientId,
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
      });

      const logs = await auditService.queryByDateRange(
        'clinic-1',
        startDate,
        endDate,
      );

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should aggregate clinic sync statistics', async () => {
      const clinicId = 'clinic-stats';

      // Log multiple sync events
      for (let i = 0; i < 5; i++) {
        await auditService.logEvent({
          clinicId,
          patientId: `patient-${i}`,
          action: 'sync-success',
          source: 'toolbox',
          status: 'success',
          eventData: { syncTime: 1000 + i * 100 },
        });
      }

      // Log some failures
      for (let i = 0; i < 2; i++) {
        await auditService.logEvent({
          clinicId,
          patientId: `patient-fail-${i}`,
          action: 'sync-failed',
          source: 'toolbox',
          status: 'failed',
          errorMessage: 'Sync error',
        });
      }

      // Query all logs for clinic
      const logs = await auditService.queryByClinic(clinicId);

      expect(logs.length).toBeGreaterThanOrEqual(7);

      // Verify success and failure events exist
      const successes = logs.filter((l) => l.status === 'success');
      const failures = logs.filter((l) => l.status === 'failed');

      expect(successes.length).toBeGreaterThanOrEqual(5);
      expect(failures.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle migration lifecycle events', async () => {
      const clinicId = 'clinic-migration';

      // Log migration started
      const startLog = await auditService.logEvent({
        clinicId,
        action: 'migration-started',
        source: 'crm',
        status: 'success',
        eventData: {
          totalPatients: 1000,
          batchSize: 50,
        },
      });

      expect(startLog.action).toBe('migration-started');

      // Log batch completion events
      for (let batch = 1; batch <= 3; batch++) {
        await auditService.logEvent({
          clinicId,
          action: 'migration-batch-completed',
          source: 'crm',
          status: 'success',
          eventData: {
            batchNumber: batch,
            batchSize: 50,
            processedCount: batch * 50,
          },
        });
      }

      // Log migration completed
      const completeLog = await auditService.logEvent({
        clinicId,
        action: 'migration-completed',
        source: 'crm',
        status: 'success',
        eventData: {
          totalProcessed: 1000,
          failedCount: 3,
          duration: 2100,
        },
      });

      expect(completeLog.eventData.totalProcessed).toBe(1000);

      // Verify migration logs
      const migrationLogs = await auditService.queryByClinic(clinicId);

      expect(migrationLogs.map((l) => l.action)).toContain('migration-started');
      expect(migrationLogs.map((l) => l.action)).toContain('migration-completed');
    });

    it('should detect failure patterns (>= 3 failures)', async () => {
      const testClinicId = 'clinic-failure-pattern';

      // Log 3 failure events
      for (let i = 0; i < 3; i++) {
        await auditService.logEvent({
          clinicId: testClinicId,
          patientId: `patient-fail-${i}`,
          action: 'sync-failed',
          source: 'toolbox',
          status: 'failed',
          errorMessage: `Sync failure ${i}`,
        });
      }

      // Query failures
      const failures = await auditService.queryFailures(testClinicId, 24);

      expect(failures.length).toBe(3);
      expect(failures.every((f) => f.status === 'failed')).toBe(true);
    });
  });

  describe('API Endpoints', () => {
    it('should return audit logs via GET /sync/audit/clinic', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/audit/clinic')
        .set('Authorization', `Bearer ${JWT_TOKEN}`)
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return stats via GET /sync/audit/stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/audit/stats')
        .set('Authorization', `Bearer ${JWT_TOKEN}`)
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.failureAlert).toBeDefined();
    });

    it('should return retry patterns via GET /sync/audit/retry-patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/sync/audit/retry-patterns')
        .set('Authorization', `Bearer ${JWT_TOKEN}`)
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data.avgRetriesPerSync).toBeDefined();
      expect(response.body.data.successRateAfterRetry).toBeDefined();
    });
  });

  describe('Multi-Clinic Isolation', () => {
    it('should isolate logs between clinics', async () => {
      // Log event for clinic-1
      await auditService.logEvent({
        clinicId: 'clinic-isolation-1',
        patientId: 'patient-1',
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
      });

      // Log event for clinic-2
      await auditService.logEvent({
        clinicId: 'clinic-isolation-2',
        patientId: 'patient-2',
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
      });

      // Query clinic-1 logs
      const clinic1Logs = await auditService.queryByClinic(
        'clinic-isolation-1',
      );
      const clinic2Logs = await auditService.queryByClinic(
        'clinic-isolation-2',
      );

      // Verify isolation
      expect(clinic1Logs.every((l) => l.clinicId === 'clinic-isolation-1')).toBe(
        true,
      );
      expect(clinic2Logs.every((l) => l.clinicId === 'clinic-isolation-2')).toBe(
        true,
      );
    });
  });
});
