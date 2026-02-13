import Decimal from "decimal.js";
import { Patient } from "../../patients/entities/patient.entity";
import { TreatmentSession } from "./treatment-session.entity";
export declare class TreatmentCourse {
    id: string;
    patientId: string;
    templateId: string;
    status: "active" | "completed" | "abandoned";
    purchaseDate: Date;
    purchaseAmount: Decimal;
    pointsRedeemed: Decimal;
    actualPayment: Decimal;
    clinicId: string;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    patient: Patient;
    sessions: TreatmentSession[];
}
