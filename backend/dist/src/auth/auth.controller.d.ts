import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    getProfile(req: {
        user: JwtPayload;
    }): Promise<{
        id: string;
        username: string;
        role: string;
        clinicId: string;
    }>;
    refreshToken(req: {
        user: JwtPayload;
    }): Promise<{
        accessToken: string;
        tokenType: string;
    }>;
}
