export class TreatmentCompletedEvent {
  constructor(
    public readonly treatmentId: string,
    public readonly clinicId: string,
    public readonly completedAt: Date = new Date(),
  ) {}
}
