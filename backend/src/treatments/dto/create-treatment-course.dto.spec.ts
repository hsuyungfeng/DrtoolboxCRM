import { validate } from 'class-validator';
import { CreateTreatmentCourseDto } from './create-treatment-course.dto';

describe('CreateTreatmentCourseDto', () => {
  it('should validate correct DTO', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = '550e8400-e29b-41d4-a716-446655440000';
    dto.clinicId = '550e8400-e29b-41d4-a716-446655440001';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate DTO with optional pointsToRedeem', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = '550e8400-e29b-41d4-a716-446655440000';
    dto.clinicId = '550e8400-e29b-41d4-a716-446655440001';
    dto.pointsToRedeem = 100.5;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when patientId is empty', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.templateId = '550e8400-e29b-41d4-a716-446655440000';
    dto.clinicId = '550e8400-e29b-41d4-a716-446655440001';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail when templateId is not a UUID', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = 'not-a-uuid';
    dto.clinicId = '550e8400-e29b-41d4-a716-446655440001';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when clinicId is not a UUID', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = '550e8400-e29b-41d4-a716-446655440000';
    dto.clinicId = 'invalid-clinic-id';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when pointsToRedeem is negative', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = '550e8400-e29b-41d4-a716-446655440000';
    dto.clinicId = '550e8400-e29b-41d4-a716-446655440001';
    dto.pointsToRedeem = -10;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
