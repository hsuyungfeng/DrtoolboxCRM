import { Treatment } from "../../treatments/entities/treatment.entity";
export declare class Patient {
    id: string;
    name: string;
    idNumber: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    address: string;
    medicalNotes: string;
    allergies: string;
    currentMedications: string;
    status: string;
    emergencyContact: string;
    emergencyPhone: string;
    clinicId: string;
    assignedDoctorId: string;
    referredBy: string;
    referrerType: string;
    pointsBalance: number;
    createdAt: Date;
    updatedAt: Date;
    treatments: Treatment[];
}
