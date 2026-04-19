import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { StaffService } from "../staff/services/staff.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly staffService: StaffService,
  ) {}

  /**
   * 使用者登入
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password, clinicId } = loginDto;

    // 查找使用者（員工）
    const staff = await this.staffService.findByUsername(username, clinicId);

    if (!staff) {
      this.logger.warn(`登入失敗：使用者 ${username} 不存在於診所 ${clinicId}`);
      throw new UnauthorizedException("使用者名稱或密碼錯誤");
    }

    // 驗證密碼
    const isPasswordValid = await this.validatePassword(password, staff.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`登入失敗：使用者 ${username} 密碼錯誤`);
      throw new UnauthorizedException("使用者名稱或密碼錯誤");
    }

    // 生成 JWT
    const payload: JwtPayload = {
      sub: staff.id,
      username: staff.name, // 使用員工姓名作為顯示名稱
      role: staff.role,
      clinicId: staff.clinicId,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 7 * 24 * 60 * 60; // 7 天（秒）

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

  /**
   * 驗證密碼
   */
  private async validatePassword(
    password: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, passwordHash);
    } catch {
      return false;
    }
  }

  /**
   * 雜湊密碼
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 驗證 JWT 權杖
   */
  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * 刷新權杖
   */
  async refreshToken(payload: JwtPayload): Promise<string> {
    const newPayload: JwtPayload = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      clinicId: payload.clinicId,
    };
    return this.jwtService.sign(newPayload);
  }
}
