import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ReferralService } from "../services/referral.service";

/**
 * 治療創建事件有效載荷
 */
interface TreatmentCreatedEvent {
  treatmentId: string;
  patientId: string;
  clinicId: string;
}

/**
 * ReferralEventListener - 推薦事件監聽器
 * 監聽治療創建事件，自動轉化推薦記錄
 */
@Injectable()
export class ReferralEventListener {
  private readonly logger = new Logger(ReferralEventListener.name);

  constructor(private readonly referralService: ReferralService) {}

  /**
   * 監聽 'treatment.created' 事件
   * 當患者的治療被創建時，自動檢查並轉化推薦記錄
   *
   * @param event 治療創建事件
   */
  @OnEvent("treatment.created")
  async handleTreatmentCreated(event: TreatmentCreatedEvent): Promise<void> {
    const { treatmentId, patientId, clinicId } = event;

    try {
      // 檢查患者是否有推薦記錄
      const referral = await this.referralService.getReferralByPatient(
        patientId,
        clinicId,
      );

      // 如果沒有推薦記錄或推薦已被處理，則跳過
      if (!referral || referral.status !== "pending") {
        this.logger.debug(`患者 ${patientId} 無待處理的推薦記錄，跳過轉化邏輯`);
        return;
      }

      // 轉化推薦記錄
      await this.referralService.convertReferral(
        referral.id,
        treatmentId,
        clinicId,
      );

      this.logger.log(
        `成功自動轉化推薦 ${referral.id}（患者：${patientId}，治療：${treatmentId}）`,
      );
    } catch (error) {
      this.logger.error(
        `轉化推薦記錄失敗（患者：${patientId}，治療：${treatmentId}）：${error.message}`,
        error.stack,
      );
      // 不拋出異常，避免中斷治療創建流程
    }
  }
}
