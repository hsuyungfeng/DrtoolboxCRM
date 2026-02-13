import { validate } from "class-validator";
import { StaffAssignmentDto } from "./staff-assignment.dto";

describe("StaffAssignmentDto", () => {
  it("should validate correct staff assignment", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.staffRole = "DOCTOR";
    dto.ppfPercentage = 60;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should fail when staffId is missing", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffRole = "DOCTOR";
    dto.ppfPercentage = 60;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("isNotEmpty");
  });

  it("should fail when staffRole is missing", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.ppfPercentage = 60;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when ppfPercentage is missing", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.staffRole = "DOCTOR";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when ppfPercentage is negative", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.staffRole = "DOCTOR";
    dto.ppfPercentage = -10;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail when ppfPercentage exceeds 100", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.staffRole = "DOCTOR";
    dto.ppfPercentage = 150;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should validate ppfPercentage boundary values", async () => {
    const boundaries = [0, 50, 100];

    for (const percentage of boundaries) {
      const dto = new StaffAssignmentDto();
      dto.staffId = "staff-001";
      dto.staffRole = "DOCTOR";
      dto.ppfPercentage = percentage;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it("should allow decimal ppfPercentage values", async () => {
    const dto = new StaffAssignmentDto();
    dto.staffId = "staff-001";
    dto.staffRole = "DOCTOR";
    dto.ppfPercentage = 33.33;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should validate various staff roles", async () => {
    const roles = ["DOCTOR", "THERAPIST", "NURSE", "ASSISTANT"];

    for (const role of roles) {
      const dto = new StaffAssignmentDto();
      dto.staffId = "staff-001";
      dto.staffRole = role;
      dto.ppfPercentage = 50;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it("should validate multiple assignment combinations", async () => {
    const assignments = [
      { staffId: "staff-001", staffRole: "DOCTOR", ppfPercentage: 60 },
      { staffId: "staff-002", staffRole: "THERAPIST", ppfPercentage: 40 },
      { staffId: "staff-003", staffRole: "NURSE", ppfPercentage: 0 },
    ];

    for (const assignmentData of assignments) {
      const dto = new StaffAssignmentDto();
      dto.staffId = assignmentData.staffId;
      dto.staffRole = assignmentData.staffRole;
      dto.ppfPercentage = assignmentData.ppfPercentage;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });
});
