import { TreatmentCourse } from "../../treatments/entities/treatment-course.entity";
export declare class Patient {
    id: string;
    clinicId: string;
    idNumber: string;
    name: string;
    gender: string;
    dateOfBirth: Date;
    phoneNumber: string;
    email: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
    medicalHistory: string;
    allergies: string;
    currentMedications: string;
    notes: string;
    assignedDoctorId: string;
    referredBy: string;
    referrerType: string;
    pointsBalance: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    treatmentCourses: TreatmentCourse[];
}
