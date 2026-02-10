import { Injectable } from '@nestjs/common';

@Injectable()
export class RevenueRuleEngine {
  calculateAmount(totalPrice: number, rule: { rule_type: string; rule_payload: any }): number {
    const ruleType = rule.rule_type;
    const rulePayload = rule.rule_payload;

    switch (ruleType) {
      case 'percentage': {
        const payload = rulePayload as { percentage: number };
        return (totalPrice * payload.percentage) / 100;
      }
      case 'fixed': {
        const payload = rulePayload as { fixed_amount: number };
        return payload.fixed_amount;
      }
      case 'tiered': {
        const payload = rulePayload as { tiers: any[] };
        const tier = payload.tiers.find(
          (t) => totalPrice >= t.from_amount && (!t.to_amount || totalPrice < t.to_amount)
        );
        if (!tier) throw new Error('No matching tier found');
        return (totalPrice * tier.percentage) / 100;
      }
      default:
        throw new Error(`Unknown rule type: ${ruleType}`);
    }
  }
}
