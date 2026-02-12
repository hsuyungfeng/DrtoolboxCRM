import { SessionCompletedEvent } from "../../events/session-completed.event";
import { TreatmentCompletedEvent } from "../../events/treatment-completed.event";
import { RevenueCalculatorService } from "../services/revenue-calculator.service";
export declare class RevenueEventListener {
    private readonly revenueCalculator;
    private readonly logger;
    constructor(revenueCalculator: RevenueCalculatorService);
    handleSessionCompletedEvent(event: SessionCompletedEvent): Promise<void>;
    handleTreatmentCompletedEvent(event: TreatmentCompletedEvent): Promise<void>;
}
