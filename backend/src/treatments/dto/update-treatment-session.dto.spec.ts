import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateTreatmentSessionDto } from './update-treatment-session.dto';
import { StaffAssignmentDto } from './staff-assignment.dto';

describe('UpdateTreatmentSessionDto', () => {
  it('should validate valid update DTO with minimal fields', async () => {
    const dto = new UpdateTreatmentSessionDto();
    dto.completionStatus = 'completed';
    dto.therapistNotes = '患者進度良好';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate empty DTO (all optional)', async () => {
    const dto = new UpdateTreatmentSessionDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with dates', async () => {
    const dto = new UpdateTreatmentSessionDto();
    dto.scheduledDate = new Date('2026-02-20T10:00:00Z');
    dto.actualStartTime = new Date('2026-02-20T10:05:00Z');
    dto.actualEndTime = new Date('2026-02-20T11:00:00Z');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate staff assignments', async () => {
    const dto = new UpdateTreatmentSessionDto();
    const assignment = new StaffAssignmentDto();
    assignment.staffId = 'staff-001';
    assignment.staffRole = 'DOCTOR';
    assignment.ppfPercentage = 60;

    dto.staffAssignments = [assignment];
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate multiple staff assignments', async () => {
    const dto = new UpdateTreatmentSessionDto();
    const assignment1 = new StaffAssignmentDto();
    assignment1.staffId = 'staff-001';
    assignment1.staffRole = 'DOCTOR';
    assignment1.ppfPercentage = 60;

    const assignment2 = new StaffAssignmentDto();
    assignment2.staffId = 'staff-002';
    assignment2.staffRole = 'THERAPIST';
    assignment2.ppfPercentage = 40;

    dto.staffAssignments = [assignment1, assignment2];
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when invalid completionStatus provided', async () => {
    const dto = new UpdateTreatmentSessionDto();
    dto.completionStatus = 'invalid-status' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate all completion statuses', async () => {
    const statuses: Array<'pending' | 'completed' | 'cancelled'> = [
      'pending',
      'completed',
      'cancelled',
    ];

    for (const status of statuses) {
      const dto = new UpdateTreatmentSessionDto();
      dto.completionStatus = status;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});

describe('StaffAssignmentDto', () => {
  it('should validate correct staff assignment', async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = 'staff-001';
    dto.staffRole = 'DOCTOR';
    dto.ppfPercentage = 60;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when staffId is missing', async () => {
    const dto = new StaffAssignmentDto();
    dto.staffRole = 'DOCTOR';
    dto.ppfPercentage = 60;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail when ppfPercentage is negative', async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = 'staff-001';
    dto.staffRole = 'DOCTOR';
    dto.ppfPercentage = -10;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when ppfPercentage exceeds 100', async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = 'staff-001';
    dto.staffRole = 'DOCTOR';
    dto.ppfPercentage = 150;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate ppfPercentage boundary values', async () => {
    const boundaries = [0, 50, 100];

    for (const percentage of boundaries) {
      const dto = new StaffAssignmentDto();
      dto.staffId = 'staff-001';
      dto.staffRole = 'DOCTOR';
      dto.ppfPercentage = percentage;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should allow decimal ppfPercentage values', async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = 'staff-001';
    dto.staffRole = 'DOCTOR';
    dto.ppfPercentage = 33.33;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
