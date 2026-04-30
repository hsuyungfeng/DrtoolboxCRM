import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("reconciliation_reports")
@Index(["clinicId", "status"])
export class ReconciliationReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({ type: "datetime" })
  reportDate: Date;

  @Column({ type: "int" })
  totalChecked: number;

  @Column({ type: "int" })
  discrepancyCount: number;

  @Column({ type: "simple-json", nullable: true })
  discrepancies: Array<{
    entityType: string;
    entityId: string;
    description: string;
    crmValue?: any;
    toolboxValue?: any;
    autoFixed: boolean;
  }>;

  @Column({
    type: "varchar",
    length: 20,
    default: "completed",
  })
  status: "in_progress" | "completed" | "failed";

  @CreateDateColumn()
  createdAt: Date;
}
