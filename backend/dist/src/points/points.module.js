"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const points_config_entity_1 = require("./entities/points-config.entity");
const points_balance_entity_1 = require("./entities/points-balance.entity");
const points_transaction_entity_1 = require("./entities/points-transaction.entity");
const points_config_service_1 = require("./services/points-config.service");
const points_transaction_service_1 = require("./services/points-transaction.service");
const points_service_1 = require("./services/points.service");
const points_controller_1 = require("./controllers/points.controller");
let PointsModule = class PointsModule {
};
exports.PointsModule = PointsModule;
exports.PointsModule = PointsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                points_config_entity_1.PointsConfig,
                points_balance_entity_1.PointsBalance,
                points_transaction_entity_1.PointsTransaction,
            ]),
        ],
        controllers: [points_controller_1.PointsController],
        providers: [
            points_config_service_1.PointsConfigService,
            points_transaction_service_1.PointsTransactionService,
            points_service_1.PointsService,
        ],
        exports: [points_service_1.PointsService, points_config_service_1.PointsConfigService, points_transaction_service_1.PointsTransactionService],
    })
], PointsModule);
//# sourceMappingURL=points.module.js.map