"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRevenueRuleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_revenue_rule_dto_1 = require("./create-revenue-rule.dto");
class UpdateRevenueRuleDto extends (0, mapped_types_1.PartialType)(create_revenue_rule_dto_1.CreateRevenueRuleDto) {
}
exports.UpdateRevenueRuleDto = UpdateRevenueRuleDto;
//# sourceMappingURL=update-revenue-rule.dto.js.map