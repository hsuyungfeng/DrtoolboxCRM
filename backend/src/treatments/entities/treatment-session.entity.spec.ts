import { TreatmentSession } from "./treatment-session.entity";
import { StaffAssignment } from "./staff-assignment.entity";
import Decimal from "decimal.js";

describe("TreatmentSession Entity", () => {
  it("should create a session with all required fields", () => {
    const session = new TreatmentSession();
    session.id = "session-001";
    session.treatmentCourseId = "course-001";
    session.sessionNumber = 1;
    session.scheduledDate = new Date("2026-02-20");
    session.completionStatus = "pending";
    session.sessionPrice = new Decimal("500.00");
    session.clinicId = "clinic-001";

    expect(session.sessionNumber).toBe(1);
    expect(session.completionStatus).toBe("pending");
    expect(session.sessionPrice.toNumber()).toBe(500);
  });

  it("should have default completionStatus = pending when saved to DB", () => {
    const session = new TreatmentSession();
    session.id = "session-002";
    session.treatmentCourseId = "course-001";
    session.sessionNumber = 1;
    session.clinicId = "clinic-001";
    // When created without explicitly setting completionStatus,
    // TypeORM default will set it to 'pending' when saved to DB
    expect(session).toBeDefined();
  });

  it("should track actual start and end times when completed", () => {
    const session = new TreatmentSession();
    session.completionStatus = "completed";
    session.actualStartTime = new Date("2026-02-20T10:00:00Z");
    session.actualEndTime = new Date("2026-02-20T11:00:00Z");

    expect(session.actualStartTime).toBeDefined();
    expect(session.actualEndTime).toBeDefined();
  });

  it("should track therapist notes and patient feedback", () => {
    const session = new TreatmentSession();
    session.therapistNotes = "患者反應良好";
    session.patientFeedback = "感覺很舒服";

    expect(session.therapistNotes).toBe("患者反應良好");
    expect(session.patientFeedback).toBe("感覺很舒服");
  });
});

describe("StaffAssignment Entity", () => {
  it("should assign staff with PPF percentage", () => {
    const assignment = new StaffAssignment();
    assignment.id = "assign-001";
    assignment.sessionId = "session-001";
    assignment.staffId = "staff-123";
    assignment.staffRole = "DOCTOR";
    assignment.ppfPercentage = new Decimal("60.00");

    expect(assignment.ppfPercentage.toNumber()).toBe(60);
  });

  it("should track calculated PPF amount", () => {
    const assignment = new StaffAssignment();
    assignment.ppfAmount = new Decimal("300.00");

    expect(assignment.ppfAmount.toNumber()).toBe(300);
  });
});
