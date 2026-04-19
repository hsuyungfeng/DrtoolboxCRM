"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const staff_service_1 = require("../staff/services/staff.service");
let AuthService = AuthService_1 = class AuthService {
    jwtService;
    staffService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(jwtService, staffService) {
        this.jwtService = jwtService;
        this.staffService = staffService;
    }
    async login(loginDto) {
        const { username, password, clinicId } = loginDto;
        const staff = await this.staffService.findByUsername(username, clinicId);
        if (!staff) {
            this.logger.warn(`登入失敗：使用者 ${username} 不存在於診所 ${clinicId}`);
            throw new common_1.UnauthorizedException("使用者名稱或密碼錯誤");
        }
        const isPasswordValid = await this.validatePassword(password, staff.passwordHash);
        if (!isPasswordValid) {
            this.logger.warn(`登入失敗：使用者 ${username} 密碼錯誤`);
            throw new common_1.UnauthorizedException("使用者名稱或密碼錯誤");
        }
        const payload = {
            sub: staff.id,
            username: staff.name,
            role: staff.role,
            clinicId: staff.clinicId,
        };
        const accessToken = this.jwtService.sign(payload);
        const expiresIn = 7 * 24 * 60 * 60;
        this.logger.log(`使用者 ${username} 登入成功`);
        return {
            accessToken,
            tokenType: "Bearer",
            expiresIn,
            user: {
                id: staff.id,
                username: staff.name,
                name: staff.name,
                role: staff.role,
                clinicId: staff.clinicId,
            },
        };
    }
    async validatePassword(password, passwordHash) {
        if (!passwordHash) {
            return false;
        }
        try {
            return await bcrypt.compare(password, passwordHash);
        }
        catch {
            return false;
        }
    }
    async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }
    async validateToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch {
            return null;
        }
    }
    async refreshToken(payload) {
        const newPayload = {
            sub: payload.sub,
            username: payload.username,
            role: payload.role,
            clinicId: payload.clinicId,
        };
        return this.jwtService.sign(newPayload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        staff_service_1.StaffService])
], AuthService);
//# sourceMappingURL=auth.service.js.map