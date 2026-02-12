import { JwtService } from "@nestjs/jwt";
import { StaffService } from "../staff/services/staff.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
export declare class AuthService {
    private readonly jwtService;
    private readonly staffService;
    private readonly logger;
    constructor(jwtService: JwtService, staffService: StaffService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    private validatePassword;
    hashPassword(password: string): Promise<string>;
    validateToken(token: string): Promise<JwtPayload | null>;
    refreshToken(payload: JwtPayload): Promise<string>;
}
