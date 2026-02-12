"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTreatmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_treatment_dto_1 = require("./create-treatment.dto");
class UpdateTreatmentDto extends (0, mapped_types_1.PartialType)(create_treatment_dto_1.CreateTreatmentDto) {
}
exports.UpdateTreatmentDto = UpdateTreatmentDto;
//# sourceMappingURL=update-treatment.dto.js.map