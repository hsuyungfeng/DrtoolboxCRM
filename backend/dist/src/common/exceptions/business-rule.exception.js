"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleException = void 0;
const common_1 = require("@nestjs/common");
const base_exception_1 = require("./base.exception");
class BusinessRuleException extends base_exception_1.BaseException {
    constructor(rule, message, details) {
        super(message, common_1.HttpStatus.CONFLICT, "BUSINESS_RULE_VIOLATION", {
            rule,
            ...details,
        });
    }
    static treatmentRule(rule, message, details) {
        return new BusinessRuleException(`TREATMENT_${rule}`, message, {
            entity: "treatment",
            ...details,
        });
    }
    static revenueRule(rule, message, details) {
        return new BusinessRuleException(`REVENUE_${rule}`, message, {
            entity: "revenue",
            ...details,
        });
    }
    static staffRule(rule, message, details) {
        return new BusinessRuleException(`STAFF_${rule}`, message, {
            entity: "staff",
            ...details,
        });
    }
}
exports.BusinessRuleException = BusinessRuleException;
//# sourceMappingURL=business-rule.exception.js.map