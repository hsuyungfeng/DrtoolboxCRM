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
export declare class RevenueRuleEngine {
    calculateAmount(totalPrice: number, rule: Rule): number;
    private validateInput;
    private calculateTieredAmount;
}
export {};
