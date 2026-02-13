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
var ReferralEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const referral_service_1 = require("../services/referral.service");
let ReferralEventListener = ReferralEventListener_1 = class ReferralEventListener {
    referralService;
    logger = new common_1.Logger(ReferralEventListener_1.name);
    constructor(referralService) {
        this.referralService = referralService;
    }
    async handleTreatmentCreated(event) {
        const { treatmentId, patientId, clinicId } = event;
        try {
            const referral = await this.referralService.getReferralByPatient(patientId, clinicId);
            if (!referral || referral.status !== "pending") {
                this.logger.debug(`患者 ${patientId} 無待處理的推薦記錄，跳過轉化邏輯`);
                return;
            }
            await this.referralService.convertReferral(referral.id, treatmentId, clinicId);
            this.logger.log(`成功自動轉化推薦 ${referral.id}（患者：${patientId}，治療：${treatmentId}）`);
        }
        catch (error) {
            this.logger.error(`轉化推薦記錄失敗（患者：${patientId}，治療：${treatmentId}）：${error.message}`, error.stack);
        }
    }
};
exports.ReferralEventListener = ReferralEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)("treatment.created"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralEventListener.prototype, "handleTreatmentCreated", null);
exports.ReferralEventListener = ReferralEventListener = ReferralEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [referral_service_1.ReferralService])
], ReferralEventListener);
//# sourceMappingURL=referral-event.listener.js.map