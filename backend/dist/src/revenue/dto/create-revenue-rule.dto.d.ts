export declare class CreateRevenueRuleDto {
    role: string;
    ruleType: string;
    rulePayload: any;
    effectiveFrom: Date;
    effectiveTo?: Date;
    clinicId: string;
    isActive?: boolean;
    description?: string;
}
