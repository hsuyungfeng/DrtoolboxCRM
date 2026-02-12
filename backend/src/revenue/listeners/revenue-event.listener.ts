import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SessionCompletedEvent } from "../../events/session-completed.event";
import { TreatmentCompletedEvent } from "../../events/treatment-completed.event";
import { RevenueCalculatorService } from "../services/revenue-calculator.service";

@Injectable()
export class RevenueEventListener {
  private readonly logger = new Logger(RevenueEventListener.name);

  constructor(private readonly revenueCalculator: RevenueCalculatorService) {}

  @OnEvent("session.completed", { async: true })
  async handleSessionCompletedEvent(event: SessionCompletedEvent) {
    this.logger.log(
      `處理療程次數完成事件: session ${event.sessionId}, treatment ${event.treatmentId}, clinic ${event.clinicId}`,
    );

    try {
      const records = await this.revenueCalculator.handleCompletedSession(
        event.sessionId,
      );
      this.logger.log(
        `成功為 session ${event.sessionId} 建立 ${records.length} 筆分潤記錄`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `處理 session.completed 事件失敗: ${errorMessage}`,
        errorStack,
      );
      // 可以考慮重試機制或錯誤通知
    }
  }

  @OnEvent("treatment.completed", { async: true })
  async handleTreatmentCompletedEvent(event: TreatmentCompletedEvent) {
    this.logger.log(
      `處理療程完成事件: treatment ${event.treatmentId}, clinic ${event.clinicId}`,
    );

    try {
      const records = await this.revenueCalculator.handleCompletedTreatment(
        event.treatmentId,
      );
      this.logger.log(
        `成功為 treatment ${event.treatmentId} 建立 ${records.length} 筆分潤記錄`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `處理 treatment.completed 事件失敗: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
