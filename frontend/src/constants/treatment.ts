/**
 * 療程相關的常數定義
 * 用於表單選項、狀態映射和療程階段定義
 */

/**
 * 會話完成狀態選項
 * 用於狀態選擇器的下拉菜單
 */
export const COMPLETION_STATUSES = [
  { label: '待執行', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

/**
 * 療程狀態選項
 * 用於療程狀態選擇器
 */
export const COURSE_STATUSES = [
  { label: '進行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已放棄', value: 'abandoned' },
];

/**
 * 療程階段定義
 * 根據會話編號將其分組到不同的治療階段
 */
export const TREATMENT_STAGE_DEFINITIONS = [
  {
    key: 'basic',
    name: '基礎治療',
    description: '初期治療階段',
    sessions: [1, 2, 3],
  },
  {
    key: 'advanced',
    name: '進階治療',
    description: '深層治療階段',
    sessions: [4, 5, 6, 7],
  },
  {
    key: 'maintenance',
    name: '維護',
    description: '維護和鞏固階段',
    sessions: [8, 9, 10],
  },
];

/**
 * 會話狀態映射
 * 用於快速查詢狀態相關的信息
 */
export const SESSION_STATUS_MAP = {
  pending: {
    text: '待執行',
    type: 'warning' as const,
    icon: 'pending' as const,
    color: '#faad14',
  },
  completed: {
    text: '已完成',
    type: 'success' as const,
    icon: 'success' as const,
    color: '#52c41a',
  },
  cancelled: {
    text: '已取消',
    type: 'error' as const,
    icon: 'cancelled' as const,
    color: '#f5222d',
  },
};

/**
 * 療程狀態映射
 */
export const COURSE_STATUS_MAP = {
  active: {
    text: '進行中',
    type: 'warning' as const,
    color: '#faad14',
  },
  completed: {
    text: '已完成',
    type: 'success' as const,
    color: '#52c41a',
  },
  abandoned: {
    text: '已放棄',
    type: 'error' as const,
    color: '#f5222d',
  },
};
