"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAFF_ROLE_CATEGORIES = exports.STAFF_ROLE_LABELS = exports.StaffRole = void 0;
var StaffRole;
(function (StaffRole) {
    StaffRole["DOCTOR"] = "doctor";
    StaffRole["NURSE"] = "nurse";
    StaffRole["BEAUTICIAN"] = "beautician";
    StaffRole["THERAPIST"] = "therapist";
    StaffRole["CONSULTANT"] = "consultant";
    StaffRole["ASSISTANT"] = "assistant";
    StaffRole["REFERRER"] = "referrer";
    StaffRole["ADMIN"] = "admin";
})(StaffRole || (exports.StaffRole = StaffRole = {}));
exports.STAFF_ROLE_LABELS = {
    [StaffRole.DOCTOR]: "醫生",
    [StaffRole.NURSE]: "護理師",
    [StaffRole.BEAUTICIAN]: "美容師",
    [StaffRole.THERAPIST]: "治療師",
    [StaffRole.CONSULTANT]: "諮詢師",
    [StaffRole.ASSISTANT]: "助理",
    [StaffRole.REFERRER]: "介紹人",
    [StaffRole.ADMIN]: "管理員",
};
exports.STAFF_ROLE_CATEGORIES = {
    CLINICAL: [
        StaffRole.DOCTOR,
        StaffRole.NURSE,
        StaffRole.BEAUTICIAN,
        StaffRole.THERAPIST,
    ],
    SUPPORT: [StaffRole.CONSULTANT, StaffRole.ASSISTANT],
    SPECIAL: [StaffRole.REFERRER],
    ADMIN: [StaffRole.ADMIN],
};
//# sourceMappingURL=staff-role.enum.js.map