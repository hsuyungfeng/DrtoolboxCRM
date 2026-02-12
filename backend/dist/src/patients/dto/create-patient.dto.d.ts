export declare class CreatePatientDto {
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    medicalNotes?: string;
    allergies?: string;
    currentMedications?: string;
    clinicId: string;
    emergencyContact?: string;
    emergencyPhone?: string;
}
