import { Test, TestingModule } from '@nestjs/testing';
import { RevenueRuleEngine } from './revenue-rule-engine.service';

// Type definitions matching the service
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

describe('RevenueRuleEngine', () => {
  let service: RevenueRuleEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueRuleEngine],
    }).compile();

    service = module.get<RevenueRuleEngine>(RevenueRuleEngine);
  });

  it('should calculate percentage-based revenue', () => {
    const rule: Rule = {
      rule_type: 'percentage',
      rule_payload: { percentage: 50 },
    };
    const totalPrice = 1000;

    const result = service.calculateAmount(totalPrice, rule);
    expect(result).toBe(500);
  });

  it('should calculate fixed-amount revenue', () => {
    const rule: Rule = {
      rule_type: 'fixed',
      rule_payload: { fixed_amount: 200 },
    };
    const totalPrice = 1000;

    const result = service.calculateAmount(totalPrice, rule);
    expect(result).toBe(200);
  });

  it('should calculate tiered-based revenue', () => {
    const rule: Rule = {
      rule_type: 'tiered',
      rule_payload: {
        tiers: [
          { from_amount: 0, to_amount: 1000, percentage: 40 },
          { from_amount: 1000, to_amount: 5000, percentage: 50 },
          { from_amount: 5000, to_amount: null, percentage: 60 },
        ],
      },
    };

    // Test middle tier: 3000 should be in tier with 50%
    const result = service.calculateAmount(3000, rule);
    expect(result).toBe(1500); // 3000 * 50 / 100
  });

  it('should throw error for unknown rule type', () => {
    const rule = {
      rule_type: 'unknown',
      rule_payload: {},
    } as unknown as Rule;

    expect(() => service.calculateAmount(1000, rule)).toThrow();
  });

  it('should match tier at boundary (totalPrice === tier boundary)', () => {
    const rule: Rule = {
      rule_type: 'tiered',
      rule_payload: {
        tiers: [
          { from_amount: 0, to_amount: 1000, percentage: 40 },
          { from_amount: 1000, to_amount: 5000, percentage: 50 },
          { from_amount: 5000, to_amount: null, percentage: 60 },
        ],
      },
    };

    // Test exactly at boundary
    const result = service.calculateAmount(1000, rule);
    expect(result).toBe(500); // 1000 * 50 / 100
  });
});
