import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Decimal from "decimal.js";
import { StaffAssignment } from "../entities/staff-assignment.entity";

@Injectable()
export class PPFCalculationService {
  constructor(
    @InjectRepository(StaffAssignment)
    private assignmentRepository: Repository<StaffAssignment>,
  ) {}

  /**
   * 驗證員工分配百分比
   * 要求：
   * - 必須至少有一個分配
   * - 所有百分比之和必須等於 100%
   *
   * @param assignments 員工分配列表，包含 ppfPercentage
   * @returns true 如果驗證通過
   * @throws BadRequestException 如果驗證失敗
   */
  validateStaffAssignments(
    assignments: { ppfPercentage: Decimal | number }[],
  ): boolean {
    // 驗證：必須至少有一個分配
    if (assignments.length === 0) {
      throw new BadRequestException("員工分配不能為空，至少需要一個員工分配");
    }

    // 計算所有百分比的總和
    let totalPercentage = new Decimal("0");
    for (const assignment of assignments) {
      const percentage =
        assignment.ppfPercentage instanceof Decimal
          ? assignment.ppfPercentage
          : new Decimal(assignment.ppfPercentage);
      totalPercentage = totalPercentage.plus(percentage);
    }

    // 驗證：百分比總和必須等於 100
    const expectedTotal = new Decimal("100");
    if (!totalPercentage.equals(expectedTotal)) {
      throw new BadRequestException(
        `員工分配百分比之和必須為 100%，目前為 ${totalPercentage.toString()}%`,
      );
    }

    return true;
  }

  /**
   * 計算單個員工的 PPF 金額
   * 公式：PPF 金額 = 支付金額 × (百分比 / 100)
   *
   * @param paymentAmount 支付金額 (Decimal)
   * @param ppfPercentage PPF 百分比 (Decimal)
   * @returns 該員工的 PPF 金額 (Decimal)
   */
  calculateStaffPPF(
    paymentAmount: Decimal,
    ppfPercentage: Decimal,
  ): Decimal {
    // 確保輸入是 Decimal 型別
    const amount =
      paymentAmount instanceof Decimal
        ? paymentAmount
        : new Decimal(paymentAmount);
    const percentage =
      ppfPercentage instanceof Decimal
        ? ppfPercentage
        : new Decimal(ppfPercentage);

    // 計算：支付金額 × (百分比 / 100)
    return amount.times(percentage.dividedBy(100));
  }

  /**
   * 分配 PPF 給所有員工
   * 流程：
   * 1. 驗證員工分配（百分比必須 = 100%）
   * 2. 為每個員工計算 PPF 金額
   * 3. 更新每個分配的 ppfAmount 欄位
   * 4. 保存到資料庫
   *
   * @param sessionId 療程次數 ID
   * @param paymentAmount 支付金額
   * @param assignments 員工分配列表
   * @returns 更新後的員工分配列表
   * @throws BadRequestException 如果驗證失敗
   */
  async distributeToStaff(
    sessionId: string,
    paymentAmount: Decimal,
    assignments: StaffAssignment[],
  ): Promise<StaffAssignment[]> {
    // 1. 驗證員工分配
    this.validateStaffAssignments(assignments);

    // 2. 為每個員工計算和更新 PPF 金額
    const updatedAssignments: StaffAssignment[] = [];

    for (const assignment of assignments) {
      // 計算該員工的 PPF 金額
      const ppfAmount = this.calculateStaffPPF(
        paymentAmount,
        assignment.ppfPercentage,
      );

      // 更新分配的 ppfAmount
      assignment.ppfAmount = ppfAmount;

      // 3. 保存到資料庫
      const savedAssignment = await this.assignmentRepository.save(assignment);

      updatedAssignments.push(savedAssignment);
    }

    // 4. 返回更新後的分配列表
    return updatedAssignments;
  }
}
