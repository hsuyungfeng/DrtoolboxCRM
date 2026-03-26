import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Patient } from "./entities/patient.entity";
import { PatientService } from "./services/patient.service";
import { PatientSearchService } from "./services/patient-search.service";
import { PatientSearchRepository } from "./repositories/patient-search.repository";
import { PatientController } from "./controllers/patient.controller";

/**
 * 患者模組
 *
 * 提供：
 * - PatientController：RESTful API 端點
 * - PatientService：CRUD 業務邏輯
 * - PatientSearchService：搜尋、驗證、分頁業務邏輯
 * - PatientSearchRepository：自定義查詢倉庫
 */
@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientController],
  providers: [PatientService, PatientSearchService, PatientSearchRepository],
  exports: [PatientService, PatientSearchService],
})
export class PatientsModule {}
