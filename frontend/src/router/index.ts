import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首頁' },
  },
  {
    path: '/patients',
    name: 'Patients',
    component: () => import('@/views/PatientsView.vue'),
    meta: { title: '患者管理' },
  },
  {
    path: '/patients/:id',
    name: 'PatientDetail',
    component: () => import('@/views/PatientDetailView.vue'),
    meta: { title: '患者詳情' },
  },
  {
    path: '/leads',
    name: 'Leads',
    component: () => import('@/views/leads/LeadKanbanView.vue'),
    meta: { title: '線索漏斗管理' },
  },
  {
    path: '/treatments',
    name: 'Treatments',
    component: () => import('@/views/TreatmentList.vue'),
    meta: { title: '療程管理' },
  },
  {
    path: '/treatments/:id',
    name: 'TreatmentDetail',
    component: () => import('@/views/TreatmentDetail.vue'),
    meta: { title: '療程詳情' },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/ScheduleView.vue'),
    meta: { title: '排程管理' },
  },
  {
    path: '/treatment-templates',
    name: 'TreatmentTemplates',
    component: () => import('@/views/TreatmentTemplatesView.vue'),
    meta: { title: '療法模板管理' },
  },
  {
    path: '/staff',
    name: 'Staff',
    component: () => import('@/views/StaffView.vue'),
    meta: { title: '員工管理' },
  },
  {
    path: '/revenue',
    name: 'Revenue',
    component: () => import('@/views/RevenueView.vue'),
    meta: { title: '分潤管理' },
  },
  {
    path: '/medical-orders',
    name: 'MedicalOrders',
    component: () => import('@/views/MedicalOrderList.vue'),
    meta: { title: '醫令管理' },
  },
  {
    path: '/medical-orders/:id',
    name: 'MedicalOrderDetail',
    component: () => import('@/views/MedicalOrderDetail.vue'),
    meta: { title: '醫令詳情' },
  },
  {
    path: '/patient-dashboard',
    name: 'PatientDashboard',
    component: () => import('@/views/PatientDashboard.vue'),
    meta: { title: '我的療程與醫令' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登入', noAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '頁面未找到' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 全局路由守衛
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();
  
  // 設置頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - Doctor CRM`;
  } else {
    document.title = 'Doctor CRM';
  }

  // --- SSO 自動登入或整合模式檢查 ---
  const { mode, clinicId, staffId, ts, sig, name, role } = to.query;
  
  // 優先處理 mode=integrated
  if (mode === 'integrated') {
    console.log('Router: 進入整合模式');
    userStore.setIntegratedMode(true);
    if (clinicId) userStore.setClinicId(clinicId as string);
    
    // 如果目前在登入頁，直接導向首頁
    if (to.path === '/login') {
      return next('/');
    }
  }

  // 處理帶簽名的 SSO (Dr. Toolbox 外部跳轉)
  if (clinicId && staffId && ts && sig && !userStore.isAuthenticated) {
    try {
      console.log('Router: 嘗試 SSO 簽名登入');
      await userStore.loginViaSSO({
        clinicId: clinicId as string,
        staffId: staffId as string,
        ts: ts as string,
        sig: sig as string,
        name: name as string,
        role: role as string,
      });
      
      const newQuery = { ...to.query };
      delete newQuery.sig;
      delete newQuery.ts;
      
      return next({ 
        path: to.path === '/login' ? '/' : to.path, 
        query: newQuery, 
        replace: true 
      });
    } catch (error) {
      console.error('SSO 失敗:', error);
    }
  }

  // --- 常規權限驗證 ---
  // 檢查是否已認證 (isAuthenticated 現在會考慮 isIntegrated 狀態)
  const isAuth = userStore.isAuthenticated;
  
  if (!to.meta.noAuth && !isAuth && to.path !== '/login') {
    console.log('Router: 未登入且無整合模式，重導向回登入頁');
    return next('/login');
  }
  
  next();
});

export default router;