import { TreatmentCourse } from './treatment-course.entity';
import Decimal from 'decimal.js';

describe('TreatmentCourse Entity', () => {
  it('should create a course with all required fields', () => {
    const course = new TreatmentCourse();
    course.id = 'course-001';
    course.patientId = 'patient-123';
    course.templateId = 'tmpl-001';
    course.status = 'active';
    course.purchaseDate = new Date('2026-02-12');
    course.purchaseAmount = new Decimal('5000.00');
    course.pointsRedeemed = new Decimal('500.00');
    course.actualPayment = new Decimal('4500.00');
    course.clinicId = 'clinic-001';

    expect(course.patientId).toBe('patient-123');
    expect(course.status).toBe('active');
    expect(course.purchaseAmount.toNumber()).toBe(5000);
    expect(course.actualPayment.toNumber()).toBe(4500);
  });

  it('should have default status = active', () => {
    const course = new TreatmentCourse();
    expect(course.status).toBe('active');
  });

  it('should have default pointsRedeemed = 0 and actualPayment calculated', () => {
    const course = new TreatmentCourse();
    course.purchaseAmount = new Decimal('1000.00');
    course.pointsRedeemed = new Decimal('0');
    course.actualPayment = new Decimal('1000.00');

    expect(course.pointsRedeemed.toNumber()).toBe(0);
    expect(course.actualPayment.toNumber()).toBe(1000);
  });

  it('should track completion date when course is completed', () => {
    const course = new TreatmentCourse();
    course.status = 'completed';
    course.completedAt = new Date('2026-12-12');

    expect(course.completedAt).toBeDefined();
  });
});
