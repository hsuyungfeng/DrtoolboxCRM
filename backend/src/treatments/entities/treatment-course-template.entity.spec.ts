import { TreatmentCourseTemplate } from './treatment-course-template.entity';
import Decimal from 'decimal.js';

describe('TreatmentCourseTemplate Entity', () => {
  it('should create a template with all required fields', () => {
    const template = new TreatmentCourseTemplate();
    template.id = 'tmpl-001';
    template.name = '10次美容套餐';
    template.description = '完整的美容療程';
    template.totalSessions = 10;
    template.totalPrice = new Decimal('5000.00');
    template.stageConfig = [
      { stageName: '基礎治療', sessionStart: 1, sessionEnd: 3 },
      { stageName: '進階治療', sessionStart: 4, sessionEnd: 7 },
      { stageName: '維護', sessionStart: 8, sessionEnd: 10 }
    ];
    template.clinicId = 'clinic-001';
    template.isActive = true;

    expect(template.id).toBe('tmpl-001');
    expect(template.name).toBe('10次美容套餐');
    expect(template.totalSessions).toBe(10);
    expect(template.totalPrice.toNumber()).toBe(5000);
    expect(template.stageConfig.length).toBe(3);
    expect(template.clinicId).toBe('clinic-001');
    expect(template.isActive).toBe(true);
  });

  it('should have default isActive = true', () => {
    const template = new TreatmentCourseTemplate();
    expect(template.isActive).toBe(true);
  });

  it('should store stage config with correct structure', () => {
    const template = new TreatmentCourseTemplate();
    template.stageConfig = [
      { stageName: '基礎', sessionStart: 1, sessionEnd: 3 }
    ];

    expect(template.stageConfig[0].stageName).toBe('基礎');
    expect(template.stageConfig[0].sessionStart).toBe(1);
    expect(template.stageConfig[0].sessionEnd).toBe(3);
  });

  it('should handle decimal price correctly', () => {
    const template = new TreatmentCourseTemplate();
    const price = new Decimal('2499.99');
    template.totalPrice = price;

    expect(template.totalPrice.toNumber()).toBe(2499.99);
  });
});
