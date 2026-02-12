export declare enum StaffRole {
    DOCTOR = "doctor",
    NURSE = "nurse",
    BEAUTICIAN = "beautician",
    THERAPIST = "therapist",
    CONSULTANT = "consultant",
    ASSISTANT = "assistant",
    REFERRER = "referrer",
    ADMIN = "admin"
}
export declare const STAFF_ROLE_LABELS: Record<StaffRole, string>;
export declare const STAFF_ROLE_CATEGORIES: {
    CLINICAL: StaffRole[];
    SUPPORT: StaffRole[];
    SPECIAL: StaffRole[];
    ADMIN: StaffRole[];
};
