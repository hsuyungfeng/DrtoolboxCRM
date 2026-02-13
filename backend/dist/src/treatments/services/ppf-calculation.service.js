"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPFCalculationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const decimal_js_1 = __importDefault(require("decimal.js"));
const staff_assignment_entity_1 = require("../entities/staff-assignment.entity");
let PPFCalculationService = class PPFCalculationService {
    assignmentRepository;
    constructor(assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }
    validateStaffAssignments(assignments) {
        if (assignments.length === 0) {
            throw new common_1.BadRequestException("員工分配不能為空，至少需要一個員工分配");
        }
        let totalPercentage = new decimal_js_1.default("0");
        for (const assignment of assignments) {
            const percentage = assignment.ppfPercentage instanceof decimal_js_1.default
                ? assignment.ppfPercentage
                : new decimal_js_1.default(assignment.ppfPercentage);
            totalPercentage = totalPercentage.plus(percentage);
        }
        const expectedTotal = new decimal_js_1.default("100");
        if (!totalPercentage.equals(expectedTotal)) {
            throw new common_1.BadRequestException(`員工分配百分比之和必須為 100%，目前為 ${totalPercentage.toString()}%`);
        }
        return true;
    }
    calculateStaffPPF(paymentAmount, ppfPercentage) {
        const amount = paymentAmount instanceof decimal_js_1.default
            ? paymentAmount
            : new decimal_js_1.default(paymentAmount);
        const percentage = ppfPercentage instanceof decimal_js_1.default
            ? ppfPercentage
            : new decimal_js_1.default(ppfPercentage);
        return amount.times(percentage.dividedBy(100));
    }
    async distributeToStaff(sessionId, paymentAmount, assignments) {
        this.validateStaffAssignments(assignments);
        const updatedAssignments = [];
        for (const assignment of assignments) {
            const ppfAmount = this.calculateStaffPPF(paymentAmount, assignment.ppfPercentage);
            assignment.ppfAmount = ppfAmount;
            const savedAssignment = await this.assignmentRepository.save(assignment);
            updatedAssignments.push(savedAssignment);
        }
        return updatedAssignments;
    }
};
exports.PPFCalculationService = PPFCalculationService;
exports.PPFCalculationService = PPFCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(staff_assignment_entity_1.StaffAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PPFCalculationService);
//# sourceMappingURL=ppf-calculation.service.js.map