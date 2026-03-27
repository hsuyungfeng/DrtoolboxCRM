export class CourseCompletedEvent {
  constructor(
    public readonly courseId: string,
    public readonly patientId: string,
    public readonly clinicId: string,
    public readonly completedAt: Date = new Date(),
  ) {}
}
