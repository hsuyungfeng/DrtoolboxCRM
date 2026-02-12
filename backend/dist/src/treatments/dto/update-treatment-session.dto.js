"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTreatmentSessionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_treatment_session_dto_1 = require("./create-treatment-session.dto");
class UpdateTreatmentSessionDto extends (0, mapped_types_1.PartialType)(create_treatment_session_dto_1.CreateTreatmentSessionDto) {
}
exports.UpdateTreatmentSessionDto = UpdateTreatmentSessionDto;
//# sourceMappingURL=update-treatment-session.dto.js.map