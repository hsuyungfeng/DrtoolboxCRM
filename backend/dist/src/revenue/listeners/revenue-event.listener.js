"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RevenueEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const session_completed_event_1 = require("../../events/session-completed.event");
const treatment_completed_event_1 = require("../../events/treatment-completed.event");
const revenue_calculator_service_1 = require("../services/revenue-calculator.service");
let RevenueEventListener = RevenueEventListener_1 = class RevenueEventListener {
    revenueCalculator;
    logger = new common_1.Logger(RevenueEventListener_1.name);
    constructor(revenueCalculator) {
        this.revenueCalculator = revenueCalculator;
    }
    async handleSessionCompletedEvent(event) {
        this.logger.log(`處理療程次數完成事件: session ${event.sessionId}, treatment ${event.treatmentId}, clinic ${event.clinicId}`);
        try {
            const records = await this.revenueCalculator.handleCompletedSession(event.sessionId);
            this.logger.log(`成功為 session ${event.sessionId} 建立 ${records.length} 筆分潤記錄`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`處理 session.completed 事件失敗: ${errorMessage}`, errorStack);
        }
    }
    async handleTreatmentCompletedEvent(event) {
        this.logger.log(`處理療程完成事件: treatment ${event.treatmentId}, clinic ${event.clinicId}`);
        try {
            const records = await this.revenueCalculator.handleCompletedTreatment(event.treatmentId);
            this.logger.log(`成功為 treatment ${event.treatmentId} 建立 ${records.length} 筆分潤記錄`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`處理 treatment.completed 事件失敗: ${errorMessage}`, errorStack);
        }
    }
};
exports.RevenueEventListener = RevenueEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)("session.completed", { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_completed_event_1.SessionCompletedEvent]),
    __metadata("design:returntype", Promise)
], RevenueEventListener.prototype, "handleSessionCompletedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)("treatment.completed", { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [treatment_completed_event_1.TreatmentCompletedEvent]),
    __metadata("design:returntype", Promise)
], RevenueEventListener.prototype, "handleTreatmentCompletedEvent", null);
exports.RevenueEventListener = RevenueEventListener = RevenueEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [revenue_calculator_service_1.RevenueCalculatorService])
], RevenueEventListener);
//# sourceMappingURL=revenue-event.listener.js.map