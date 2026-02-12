import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Doctor CRM API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return 404 for root endpoint (moved to /api)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(404);
    });

    it('should return API documentation at /api/docs', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);
    });
  });

  describe('Patients Module', () => {
    it('GET /api/patients should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/patients?clinicId=clinic_001')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/patients should require clinicId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/patients')
        .expect(401); // 需要 clinicId 參數，中間件返回 401 Unauthorized
    });
  });

  describe('Treatments Module', () => {
    it('GET /api/treatments should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/treatments?clinicId=clinic_001')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/treatments should require clinicId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/treatments')
        .expect(401);
    });
  });

  describe('Treatment Sessions Module', () => {
    it('GET /api/treatment-sessions should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/treatment-sessions?clinicId=clinic_001')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/treatment-sessions should require clinicId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/treatment-sessions')
        .expect(400);
    });
  });

  describe('Staff Module', () => {
    it('GET /api/staff should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/staff')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/staff should require clinicId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/staff')
        .expect(400);
    });
  });

  describe('Revenue Module', () => {
    it('GET /api/revenue-rules should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/revenue-rules')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/revenue-rules should require clinicId query parameter', () => {
      return request(app.getHttpServer())
        .get('/api/revenue-rules')
        .expect(400);
    });

    it('GET /api/revenue-records should return array (empty or with data)', () => {
      return request(app.getHttpServer())
        .get('/api/revenue-records')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});