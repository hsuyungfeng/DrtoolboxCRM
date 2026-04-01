/**
 * API Mock 資料與攔截工具
 *
 * 為 E2E 測試提供穩定的模擬資料，確保測試不依賴後端狀態
 * 涵蓋的 API 端點：
 *   - GET    /api/treatments/courses         — 療程列表
 *   - POST   /api/treatments/courses         — 建立療程
 *   - GET    /api/treatments/courses/:id      — 療程詳情
 *   - DELETE /api/treatments/courses/:id      — 刪除療程
 *   - GET    /api/treatments/templates        — 療程範本列表
 *   - PATCH  /api/treatments/sessions/:id/complete — 標記課程完成
 *   - GET    /api/patients                    — 患者搜尋
 */
import { Page, Route } from '@playwright/test';

// ============================================================
// 模擬資料定義
// ============================================================

/** 患者模擬資料 */
export const mockPatients = [
  {
    id: 'pat_001',
    name: '王小明',
    idNumber: 'A123456789',
    phone: '0912345678',
    gender: 'male',
    clinicId: 'clinic_001',
  },
  {
    id: 'pat_002',
    name: '李美玲',
    idNumber: 'B234567890',
    phone: '0923456789',
    gender: 'female',
    clinicId: 'clinic_001',
  },
  {
    id: 'pat_003',
    name: '陳大華',
    idNumber: 'C345678901',
    phone: '0934567890',
    gender: 'male',
    clinicId: 'clinic_001',
  },
];

/** 療程範本模擬資料 */
export const mockTemplates = [
  {
    id: 'tmpl_001',
    name: '玻尿酸注射療程',
    description: '臉部玻尿酸注射，每月一次',
    defaultPrice: 12000,
    defaultSessions: 3,
    clinicId: 'clinic_001',
  },
  {
    id: 'tmpl_002',
    name: '雷射除斑療程',
    description: '皮秒雷射治療，雙週一次',
    defaultPrice: 8000,
    defaultSessions: 5,
    clinicId: 'clinic_001',
  },
  {
    id: 'tmpl_003',
    name: '復健物理治療',
    description: '肩頸復健療程，每週一次',
    defaultPrice: 3000,
    defaultSessions: 10,
    clinicId: 'clinic_001',
  },
];

/** 課程 session 模擬資料產生器 */
function generateSessions(
  courseId: string,
  total: number,
  completed: number,
): Array<{
  id: string;
  courseId: string;
  sequenceNumber: number;
  completionStatus: string;
  staffAssignments: Array<{ staffId: string; staffName: string }>;
}> {
  return Array.from({ length: total }, (_, i) => ({
    id: `session_${courseId}_${i + 1}`,
    courseId,
    sequenceNumber: i + 1,
    completionStatus: i < completed ? 'completed' : 'pending',
    staffAssignments:
      i < completed ? [{ staffId: 'staff_001', staffName: '張醫師' }] : [],
  }));
}

/** 療程（課程套餐）模擬資料 */
export const mockTreatments = [
  {
    id: 'course_001',
    name: '玻尿酸注射療程',
    patientId: 'pat_001',
    patient: { name: '王小明' },
    patientName: '王小明',
    type: 'cosmetic',
    costPerSession: 12000,
    totalSessions: 3,
    completedSessions: 1,
    progress: { completedSessions: 1, totalSessions: 3 },
    status: 'in_progress',
    description: '臉部玻尿酸注射，每月一次',
    sessions: generateSessions('course_001', 3, 1),
    clinicId: 'clinic_001',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'course_002',
    name: '雷射除斑療程',
    patientId: 'pat_002',
    patient: { name: '李美玲' },
    patientName: '李美玲',
    type: 'cosmetic',
    costPerSession: 8000,
    totalSessions: 5,
    completedSessions: 0,
    progress: { completedSessions: 0, totalSessions: 5 },
    status: 'pending',
    description: '',
    sessions: generateSessions('course_002', 5, 0),
    clinicId: 'clinic_001',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'course_003',
    name: '復健物理治療',
    patientId: 'pat_003',
    patient: { name: '陳大華' },
    patientName: '陳大華',
    type: 'rehabilitation',
    costPerSession: 3000,
    totalSessions: 10,
    completedSessions: 5,
    progress: { completedSessions: 5, totalSessions: 10 },
    status: 'in_progress',
    description: '每週一次復健',
    sessions: generateSessions('course_003', 10, 5),
    clinicId: 'clinic_001',
    createdAt: '2026-01-10T08:00:00Z',
  },
];

// ============================================================
// API 攔截設定
// ============================================================

/**
 * 設定所有療程相關的 API Mock
 * 攔截前端 HTTP 請求，回傳預設模擬資料
 */
export async function setupTreatmentApiMocks(page: Page) {
  // 使用可變副本，讓測試過程中能動態新增 / 刪除 / 更新
  let currentTreatments = JSON.parse(JSON.stringify(mockTreatments));

  // ---- /api/patients（患者遠端搜尋） ----
  await page.route('**/api/patients*', async (route: Route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get('search') || '';
    const filtered = search
      ? mockPatients.filter(
          (p) => p.name.includes(search) || p.idNumber.includes(search),
        )
      : mockPatients;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  });

  // ---- /api/treatments/templates（療程範本列表） ----
  await page.route('**/api/treatments/templates*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTemplates),
    });
  });

  // ---- /api/treatments/sessions/:id/complete（標記課程完成） ----
  await page.route(
    /\/api\/treatments\/sessions\/[^/]+\/complete/,
    async (route: Route) => {
      const url = route.request().url();
      const sessionIdMatch = url.match(/\/sessions\/([^/]+)\/complete/);
      const sessionId = sessionIdMatch?.[1];

      if (sessionId) {
        // 找到對應課程並更新
        for (const course of currentTreatments) {
          const session = course.sessions?.find(
            (s: { id: string }) => s.id === sessionId,
          );
          if (session) {
            session.completionStatus = 'completed';
            session.staffAssignments = [
              { staffId: 'staff_001', staffName: '張醫師' },
            ];
            // 更新課程進度
            const completedCount = course.sessions.filter(
              (s: { completionStatus: string }) =>
                s.completionStatus === 'completed',
            ).length;
            course.completedSessions = completedCount;
            course.progress.completedSessions = completedCount;
            break;
          }
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    },
  );

  // ---- /api/treatments/courses/:id（GET / DELETE） ----
  await page.route(
    /\/api\/treatments\/courses\/[a-zA-Z0-9_-]+/,
    async (route: Route) => {
      const method = route.request().method();
      const url = route.request().url();
      const idMatch = url.match(/\/courses\/([^?/]+)/);
      const courseId = idMatch?.[1];

      if (method === 'GET' && courseId) {
        const item = currentTreatments.find(
          (t: { id: string }) => t.id === courseId,
        );
        if (item) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(item),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: '療程不存在' }),
          });
        }
      } else if (method === 'DELETE' && courseId) {
        currentTreatments = currentTreatments.filter(
          (t: { id: string }) => t.id !== courseId,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    },
  );

  // ---- /api/treatments/courses（GET 含查詢參數 / POST 不含查詢參數） ----
  // Playwright glob 不會自動匹配查詢參數，因此需要同時處理有無查詢參數的情況
  const handleCoursesRoute = async (route: Route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentTreatments),
      });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      // 依據選擇的範本建立新療程
      const template = mockTemplates.find(
        (t) => t.id === body.templateId,
      );
      const patient = mockPatients.find(
        (p) => p.id === body.patientId,
      );
      const newCourseId = `course_new_${Date.now()}`;
      const newCourse = {
        id: newCourseId,
        name: template?.name || '未命名療程',
        patientId: body.patientId,
        patient: { name: patient?.name || '-' },
        patientName: patient?.name || '-',
        type: 'other',
        costPerSession: template?.defaultPrice || 0,
        totalSessions: template?.defaultSessions || 1,
        completedSessions: 0,
        progress: {
          completedSessions: 0,
          totalSessions: template?.defaultSessions || 1,
        },
        status: 'pending',
        description: template?.description || '',
        sessions: generateSessions(
          newCourseId,
          template?.defaultSessions || 1,
          0,
        ),
        clinicId: body.clinicId || 'clinic_001',
        createdAt: new Date().toISOString(),
      };
      currentTreatments = [...currentTreatments, newCourse];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newCourse),
      });
    } else {
      await route.continue();
    }
  };
  await page.route('**/api/treatments/courses', handleCoursesRoute);
  await page.route('**/api/treatments/courses?*', handleCoursesRoute);

  return {
    getCurrentTreatments: () => currentTreatments,
  };
}
