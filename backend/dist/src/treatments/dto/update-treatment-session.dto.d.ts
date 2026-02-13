import { StaffAssignmentDto } from "./staff-assignment.dto";
export declare class UpdateTreatmentSessionDto {
    scheduledDate?: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
    completionStatus?: "pending" | "completed" | "cancelled";
    status?: "pending" | "completed" | "cancelled";
    therapistNotes?: string;
    patientFeedback?: string;
    staffAssignments?: StaffAssignmentDto[];
}
