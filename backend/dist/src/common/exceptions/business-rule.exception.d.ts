import { BaseException } from './base.exception';
export declare class BusinessRuleException extends BaseException {
    constructor(rule: string, message: string, details?: Record<string, any>);
    static treatmentRule(rule: string, message: string, details?: Record<string, any>): BusinessRuleException;
    static revenueRule(rule: string, message: string, details?: Record<string, any>): BusinessRuleException;
    static staffRule(rule: string, message: string, details?: Record<string, any>): BusinessRuleException;
}
