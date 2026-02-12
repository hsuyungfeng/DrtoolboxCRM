import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

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
    path: '/treatments',
    name: 'Treatments',
    component: () => import('@/views/TreatmentsView.vue'),
    meta: { title: '療程管理' },
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
router.beforeEach((to, _from, next) => {
  // 設置頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - Doctor CRM`;
  } else {
    document.title = 'Doctor CRM';
  }
  
  // 這裡可以添加權限驗證邏輯
  next();
});

export default router;