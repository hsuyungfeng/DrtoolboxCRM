"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentCompletedEvent = void 0;
class TreatmentCompletedEvent {
    treatmentId;
    clinicId;
    completedAt;
    constructor(treatmentId, clinicId, completedAt = new Date()) {
        this.treatmentId = treatmentId;
        this.clinicId = clinicId;
        this.completedAt = completedAt;
    }
}
exports.TreatmentCompletedEvent = TreatmentCompletedEvent;
//# sourceMappingURL=treatment-completed.event.js.map