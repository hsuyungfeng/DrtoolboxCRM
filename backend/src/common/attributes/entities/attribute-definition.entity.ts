import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum AttributeTarget {
  PATIENT = "patient",
  TREATMENT = "treatment",
}

export enum AttributeType {
  TEXT = "text",
  NUMBER = "number",
  DATE = "date",
  SELECT = "select",
  MULTISELECT = "multiselect",
  FILE = "file",
  DATERANGE = "daterange",
}

@Entity("attribute_definitions")
@Index(["clinicId", "targetEntity"])
export class AttributeDefinition {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @Column({
    type: "varchar",
    length: 20,
  })
  targetEntity: AttributeTarget;

  @Column({ type: "varchar", length: 50 })
  name: string; // The key used in JSONB

  @Column({ type: "varchar", length: 100 })
  label: string; // The display label

  @Column({
    type: "varchar",
    length: 20,
  })
  type: AttributeType;

  @Column({ type: "simple-json", nullable: true })
  options: string[] | null; // For select types

  @Column({ type: "boolean", default: false })
  isRequired: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
