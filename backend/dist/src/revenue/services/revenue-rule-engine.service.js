"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueRuleEngine = void 0;
const common_1 = require("@nestjs/common");
let RevenueRuleEngine = class RevenueRuleEngine {
    calculateAmount(totalPrice, rule) {
        this.validateInput(totalPrice, rule);
        const ruleType = rule.rule_type;
        const rulePayload = rule.rule_payload;
        switch (ruleType) {
            case 'percentage': {
                const payload = rulePayload;
                return Math.round((totalPrice * payload.percentage) / 100 * 100) / 100;
            }
            case 'fixed': {
                const payload = rulePayload;
                return Math.round(payload.fixed_amount * 100) / 100;
            }
            case 'tiered': {
                return this.calculateTieredAmount(totalPrice, rulePayload);
            }
            default:
                throw new Error(`Unknown rule type: ${ruleType}`);
        }
    }
    validateInput(totalPrice, rule) {
        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            throw new Error(`Invalid totalPrice: ${totalPrice}`);
        }
        if (!rule || !rule.rule_type) {
            throw new Error('Rule must have rule_type');
        }
    }
    calculateTieredAmount(totalPrice, payload) {
        if (!payload.tiers || payload.tiers.length === 0) {
            throw new Error('Tiered rule must have at least one tier');
        }
        const tier = payload.tiers.find((t) => {
            if (t.from_amount === undefined || t.from_amount === null) {
                throw new Error('Tier must have from_amount');
            }
            if (t.percentage === undefined || t.percentage === null) {
                throw new Error('Tier must have percentage');
            }
            const above_from = totalPrice >= t.from_amount;
            const below_to = t.to_amount === null || t.to_amount === undefined || totalPrice < t.to_amount;
            return above_from && below_to;
        });
        if (!tier)
            throw new Error('No matching tier found');
        return Math.round((totalPrice * tier.percentage) / 100 * 100) / 100;
    }
};
exports.RevenueRuleEngine = RevenueRuleEngine;
exports.RevenueRuleEngine = RevenueRuleEngine = __decorate([
    (0, common_1.Injectable)()
], RevenueRuleEngine);
//# sourceMappingURL=revenue-rule-engine.service.js.map