/**
 * 格式化工具函數集合
 * 提供共享的日期、時間、貨幣和狀態格式化功能
 */

/**
 * 取得會話狀態的中文文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待執行',
    completed: '已完成',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

/**
 * 取得療程狀態的中文文本
 */
export function getCourseStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: '進行中',
    completed: '已完成',
    abandoned: '已放棄',
  };
  return statusMap[status] || status;
}

/**
 * 取得會話狀態的語義名稱（用於顯示圖標）
 * 返回值可用於映射到 NIcon 或 SVG 圖標
 */
export function getStatusIcon(status: string): 'success' | 'pending' | 'cancelled' {
  const iconMap: Record<string, 'success' | 'pending' | 'cancelled'> = {
    pending: 'pending',
    completed: 'success',
    cancelled: 'cancelled',
  };
  return iconMap[status] || 'pending';
}

/**
 * 取得會話狀態的 UI 類型
 */
export function getStatusType(status: string): 'success' | 'warning' | 'error' | 'default' {
  const statusTypeMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
  };
  return statusTypeMap[status] || 'default';
}

/**
 * 取得療程狀態的 UI 類型
 */
export function getCourseStatusType(status: string): 'success' | 'warning' | 'error' | 'default' {
  const statusTypeMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    active: 'warning',
    completed: 'success',
    abandoned: 'error',
  };
  return statusTypeMap[status] || 'default';
}

/**
 * 格式化日期
 * @param dateString ISO 日期字符串
 * @returns 本地化日期字符串 (DD/MM/YYYY 格式)
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * 格式化時間
 * @param timeString ISO 時間字符串
 * @returns 本地化時間字符串 (HH:MM 格式)
 */
export function formatTime(timeString?: string): string {
  if (!timeString) return '-';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '-';
  }
}

/**
 * 格式化貨幣
 * @param value 數字或字符串
 * @returns 格式化的貨幣字符串 (含逗號)
 */
export function formatCurrency(value: string | number): string {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return '-';
  }
}

/**
 * 轉換會話時間戳
 * 從 ISO 字符串轉換為時間戳（用於 NTimePicker/NDatePicker）
 */
export function convertToTimestamp(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).getTime();
  } catch {
    return null;
  }
}

/**
 * 轉換時間戳為 ISO 字符串
 * 從時間戳轉換為 ISO 字符串（用於 API 請求）
 */
export function convertToISOString(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;
  try {
    return new Date(timestamp).toISOString();
  } catch {
    return null;
  }
}

/**
 * 轉換時間戳為日期字符串 (YYYY-MM-DD)
 */
export function convertToDateString(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;
  try {
    const dateString = new Date(timestamp).toISOString().split('T')[0];
    return dateString || null;
  } catch {
    return null;
  }
}

/**
 * 狀態色彩映射
 */
export const STATUS_COLORS = {
  pending: '#faad14',  // warning orange
  completed: '#52c41a', // success green
  cancelled: '#f5222d', // error red
};

/**
 * 療程狀態色彩映射
 */
export const COURSE_STATUS_COLORS = {
  active: '#faad14',    // warning orange
  completed: '#52c41a', // success green
  abandoned: '#f5222d', // error red
};
