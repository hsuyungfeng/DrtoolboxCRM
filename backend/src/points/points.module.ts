import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointsConfig } from "./entities/points-config.entity";
import { PointsBalance } from "./entities/points-balance.entity";
import { PointsTransaction } from "./entities/points-transaction.entity";
import { PointsConfigService } from "./services/points-config.service";
import { PointsTransactionService } from "./services/points-transaction.service";
import { PointsService } from "./services/points.service";
import { PointsController } from "./controllers/points.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([PointsConfig, PointsBalance, PointsTransaction]),
  ],
  controllers: [PointsController],
  providers: [PointsConfigService, PointsTransactionService, PointsService],
  exports: [PointsService, PointsConfigService, PointsTransactionService],
})
export class PointsModule {}
