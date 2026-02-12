"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCompletedEvent = void 0;
class SessionCompletedEvent {
    sessionId;
    treatmentId;
    clinicId;
    completedAt;
    constructor(sessionId, treatmentId, clinicId, completedAt = new Date()) {
        this.sessionId = sessionId;
        this.treatmentId = treatmentId;
        this.clinicId = clinicId;
        this.completedAt = completedAt;
    }
}
exports.SessionCompletedEvent = SessionCompletedEvent;
//# sourceMappingURL=session-completed.event.js.map