export class CourseStartedEvent {
  constructor(
    public readonly courseId: string,
    public readonly patientId: string,
    public readonly clinicId: string,
    public readonly startedAt: Date = new Date(),
  ) {}
}
