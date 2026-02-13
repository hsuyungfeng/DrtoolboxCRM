import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

/**
 * 業務規則異常
 * 用於違反業務規則的情況
 */
export class BusinessRuleException extends BaseException {
  constructor(rule: string, message: string, details?: Record<string, any>) {
    super(message, HttpStatus.CONFLICT, "BUSINESS_RULE_VIOLATION", {
      rule,
      ...details,
    });
  }

  /**
   * 創建治療相關的業務規則異常
   */
  static treatmentRule(
    rule: string,
    message: string,
    details?: Record<string, any>,
  ): BusinessRuleException {
    return new BusinessRuleException(`TREATMENT_${rule}`, message, {
      entity: "treatment",
      ...details,
    });
  }

  /**
   * 創建分潤相關的業務規則異常
   */
  static revenueRule(
    rule: string,
    message: string,
    details?: Record<string, any>,
  ): BusinessRuleException {
    return new BusinessRuleException(`REVENUE_${rule}`, message, {
      entity: "revenue",
      ...details,
    });
  }

  /**
   * 創建員工相關的業務規則異常
   */
  static staffRule(
    rule: string,
    message: string,
    details?: Record<string, any>,
  ): BusinessRuleException {
    return new BusinessRuleException(`STAFF_${rule}`, message, {
      entity: "staff",
      ...details,
    });
  }
}
