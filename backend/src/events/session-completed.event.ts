export class SessionCompletedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly treatmentId: string,
    public readonly clinicId: string,
    public readonly completedAt: Date = new Date(),
  ) {}
}
