import { Injectable } from '@nestjs/common';

// Type definitions for revenue rules
interface PercentagePayload {
  percentage: number;
}

interface FixedPayload {
  fixed_amount: number;
}

interface Tier {
  from_amount: number;
  to_amount: number | null;
  percentage: number;
}

interface TieredPayload {
  tiers: Tier[];
}

type RulePayload = PercentagePayload | FixedPayload | TieredPayload;

interface Rule {
  rule_type: 'percentage' | 'fixed' | 'tiered';
  rule_payload: RulePayload;
}

@Injectable()
export class RevenueRuleEngine {
  /**
   * 計算營收金額
   * Calculate revenue amount based on the rule type
   */
  calculateAmount(totalPrice: number, rule: Rule): number {
    this.validateInput(totalPrice, rule);

    const ruleType = rule.rule_type;
    const rulePayload = rule.rule_payload;

    switch (ruleType) {
      case 'percentage': {
        const payload = rulePayload as PercentagePayload;
        return Math.round((totalPrice * payload.percentage) / 100 * 100) / 100;
      }
      case 'fixed': {
        const payload = rulePayload as FixedPayload;
        return Math.round(payload.fixed_amount * 100) / 100;
      }
      case 'tiered': {
        return this.calculateTieredAmount(totalPrice, rulePayload as TieredPayload);
      }
      default:
        throw new Error(`Unknown rule type: ${ruleType}`);
    }
  }

  /**
   * 驗證輸入參數
   * Validate input parameters
   */
  private validateInput(totalPrice: number, rule: Rule): void {
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      throw new Error(`Invalid totalPrice: ${totalPrice}`);
    }
    if (!rule || !rule.rule_type) {
      throw new Error('Rule must have rule_type');
    }
  }

  /**
   * 計算分層營收金額
   * Calculate tiered revenue amount
   */
  private calculateTieredAmount(totalPrice: number, payload: TieredPayload): number {
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
      const below_to =
        t.to_amount === null || t.to_amount === undefined || totalPrice < t.to_amount;

      return above_from && below_to;
    });

    if (!tier) throw new Error('No matching tier found');

    return Math.round((totalPrice * tier.percentage) / 100 * 100) / 100;
  }
}
