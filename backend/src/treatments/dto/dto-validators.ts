/**
 * DTO 驗證規則常數與自訂驗證邏輯
 * Centralized validation rules and custom validators for all DTOs
 *
 * 集中定義所有驗證常數，確保驗證規則一致應用於所有端點
 */

/** 集中驗證規則常數 */
export const VALIDATION_RULES = {
  MEDICAL_ORDER: {
    /** 藥物名稱：必填，最多 200 字元 */
    藥物名稱: { min: 1, max: 200 },
    /** 劑量說明：必填，最多 100 字元 */
    劑量: { min: 1, max: 100 },
    /** 使用方式：必填，最多 100 字元 */
    使用方式: { min: 1, max: 100 },
    /** 療程數：必填，最少 1，最多 1000 */
    療程數: { min: 1, max: 1000 },
  },
  TREATMENT_COURSE: {
    /** 療程名稱：必填，最多 200 字元 */
    名稱: { min: 1, max: 200 },
    /** 費用：必須大於 0 */
    費用: { min: 0.01 },
    /** 療程數：必填，最少 1，最多 1000 */
    療程數: { min: 1, max: 1000 },
  },
  PATIENT: {
    /** 身份證號碼：必填，最多 50 字元 */
    idNumber: { min: 1, max: 50 },
    /** 患者姓名：必填，最多 100 字元 */
    名稱: { min: 1, max: 100 },
    /** 電話號碼格式驗證 */
    phoneNumber: { pattern: /^[0-9\-\+\(\)\s]+$/ },
    /** 電子郵件格式驗證 */
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
};

/** 醫令 DTO 驗證結果介面 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 驗證醫令 DTO 資料
 * 檢查藥物名稱、劑量、療程數等必要欄位
 *
 * @param dto - 醫令請求資料物件
 * @returns 驗證結果，包含是否有效及錯誤訊息清單
 */
export function validateMedicalOrder(dto: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const drugName = dto['藥物或治療名稱'] ?? dto['drugOrTreatmentName'];
  if (!drugName || typeof drugName !== 'string' || drugName.trim().length === 0) {
    errors.push('藥物名稱必填');
  } else if (drugName.length > VALIDATION_RULES.MEDICAL_ORDER.藥物名稱.max) {
    errors.push(`藥物名稱不能超過 ${VALIDATION_RULES.MEDICAL_ORDER.藥物名稱.max} 字元`);
  }

  const dosage = dto['劑量'] ?? dto['dosage'];
  if (!dosage || typeof dosage !== 'string' || dosage.trim().length === 0) {
    errors.push('劑量必填');
  } else if (dosage.length > VALIDATION_RULES.MEDICAL_ORDER.劑量.max) {
    errors.push(`劑量不能超過 ${VALIDATION_RULES.MEDICAL_ORDER.劑量.max} 字元`);
  }

  const totalSessions = dto['療程數'] ?? dto['totalSessions'];
  if (
    totalSessions === undefined ||
    totalSessions === null ||
    !Number.isInteger(totalSessions) ||
    (totalSessions as number) < VALIDATION_RULES.MEDICAL_ORDER.療程數.min
  ) {
    errors.push('療程數必須是正整數');
  } else if ((totalSessions as number) > VALIDATION_RULES.MEDICAL_ORDER.療程數.max) {
    errors.push(`療程數不能超過 ${VALIDATION_RULES.MEDICAL_ORDER.療程數.max}`);
  }

  return errors;
}

/**
 * 驗證療程 DTO 資料
 * 檢查名稱、費用、療程數等必要欄位
 *
 * @param dto - 療程請求資料物件
 * @returns 錯誤訊息清單（空陣列表示驗證通過）
 */
export function validateTreatmentCourse(dto: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const name = dto['名稱'] ?? dto['name'];
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('療程名稱必填');
  } else if (name.length > VALIDATION_RULES.TREATMENT_COURSE.名稱.max) {
    errors.push(`療程名稱不能超過 ${VALIDATION_RULES.TREATMENT_COURSE.名稱.max} 字元`);
  }

  const fee = dto['費用'] ?? dto['fee'];
  if (fee !== undefined && fee !== null) {
    const feeNum = Number(fee);
    if (isNaN(feeNum) || feeNum < VALIDATION_RULES.TREATMENT_COURSE.費用.min) {
      errors.push(`費用必須大於 ${VALIDATION_RULES.TREATMENT_COURSE.費用.min}`);
    }
  }

  const sessions = dto['療程數'] ?? dto['totalSessions'];
  if (
    sessions === undefined ||
    sessions === null ||
    !Number.isInteger(sessions) ||
    (sessions as number) < VALIDATION_RULES.TREATMENT_COURSE.療程數.min
  ) {
    errors.push('療程數必須是正整數');
  } else if ((sessions as number) > VALIDATION_RULES.TREATMENT_COURSE.療程數.max) {
    errors.push(`療程數不能超過 ${VALIDATION_RULES.TREATMENT_COURSE.療程數.max}`);
  }

  return errors;
}

/**
 * 驗證患者 DTO 資料
 * 檢查身份證號碼、姓名等必要欄位
 *
 * @param dto - 患者請求資料物件
 * @returns 錯誤訊息清單（空陣列表示驗證通過）
 */
export function validatePatient(dto: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const idNumber = dto['idNumber'];
  if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
    errors.push('身份證 ID 必填');
  } else if (idNumber.length > VALIDATION_RULES.PATIENT.idNumber.max) {
    errors.push(`身份證 ID 不能超過 ${VALIDATION_RULES.PATIENT.idNumber.max} 字元`);
  }

  const name = dto['name'] ?? dto['姓名'];
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('患者姓名必填');
  } else if (name.length > VALIDATION_RULES.PATIENT.名稱.max) {
    errors.push(`患者姓名不能超過 ${VALIDATION_RULES.PATIENT.名稱.max} 字元`);
  }

  const phone = dto['phone'] ?? dto['phoneNumber'];
  if (phone && typeof phone === 'string') {
    if (!VALIDATION_RULES.PATIENT.phoneNumber.pattern.test(phone)) {
      errors.push('電話號碼格式不正確（僅允許數字、-、+、()、空格）');
    }
  }

  const email = dto['email'];
  if (email && typeof email === 'string') {
    if (!VALIDATION_RULES.PATIENT.email.pattern.test(email)) {
      errors.push('電子郵件格式不正確');
    }
  }

  return errors;
}
