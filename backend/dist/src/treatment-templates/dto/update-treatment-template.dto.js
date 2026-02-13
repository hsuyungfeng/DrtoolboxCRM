"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTreatmentTemplateDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_treatment_template_dto_1 = require("./create-treatment-template.dto");
class UpdateTreatmentTemplateDto extends (0, mapped_types_1.PartialType)(create_treatment_template_dto_1.CreateTreatmentTemplateDto) {
}
exports.UpdateTreatmentTemplateDto = UpdateTreatmentTemplateDto;
//# sourceMappingURL=update-treatment-template.dto.js.map