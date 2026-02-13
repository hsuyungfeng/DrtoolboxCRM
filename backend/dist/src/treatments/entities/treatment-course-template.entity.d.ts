import Decimal from "decimal.js";
interface StageConfig {
    stageName: string;
    sessionStart: number;
    sessionEnd: number;
}
export declare class TreatmentCourseTemplate {
    id: string;
    name: string;
    description: string;
    totalSessions: number;
    totalPrice: Decimal;
    stageConfig: StageConfig[];
    clinicId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export {};
