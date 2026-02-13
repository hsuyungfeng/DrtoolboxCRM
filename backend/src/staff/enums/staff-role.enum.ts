/**
 * 員工角色枚舉
 * 定義系統中所有可能的員工角色
 */
export enum StaffRole {
  // 核心醫療角色
  DOCTOR = "doctor", // 醫生
  NURSE = "nurse", // 護理師
  BEAUTICIAN = "beautician", // 美容師
  THERAPIST = "therapist", // 治療師

  // 支持角色
  CONSULTANT = "consultant", // 諮詢師
  ASSISTANT = "assistant", // 助理

  // 特殊角色
  REFERRER = "referrer", // 介紹人（可以是患者或員工）

  // 管理角色
  ADMIN = "admin", // 管理員
}

/**
 * 員工角色顯示名稱
 */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.DOCTOR]: "醫生",
  [StaffRole.NURSE]: "護理師",
  [StaffRole.BEAUTICIAN]: "美容師",
  [StaffRole.THERAPIST]: "治療師",
  [StaffRole.CONSULTANT]: "諮詢師",
  [StaffRole.ASSISTANT]: "助理",
  [StaffRole.REFERRER]: "介紹人",
  [StaffRole.ADMIN]: "管理員",
};

/**
 * 員工角色類別
 */
export const STAFF_ROLE_CATEGORIES = {
  CLINICAL: [
    StaffRole.DOCTOR,
    StaffRole.NURSE,
    StaffRole.BEAUTICIAN,
    StaffRole.THERAPIST,
  ],
  SUPPORT: [StaffRole.CONSULTANT, StaffRole.ASSISTANT],
  SPECIAL: [StaffRole.REFERRER],
  ADMIN: [StaffRole.ADMIN],
};
