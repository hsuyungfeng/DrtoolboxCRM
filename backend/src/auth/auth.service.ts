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
    // 注意：實際應用中應該在 Staff 實體中添加 password 欄位
    // 這裡暫時使用簡單驗證（開發環境）
    const isPasswordValid = await this.validatePassword(password, staff.id);

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
   * 注意：這是簡化版本，實際應用應使用 bcrypt 比對
   */
  private async validatePassword(
    password: string,
    staffId: string,
  ): Promise<boolean> {
    // 開發環境：允許使用 "password123" 作為通用密碼
    if (process.env.NODE_ENV !== "production") {
      return password === "password123" || password === staffId;
    }

    // 生產環境：應該從資料庫獲取密碼雜湊並比對
    // const hashedPassword = await this.getHashedPassword(staffId);
    // return bcrypt.compare(password, hashedPassword);

    // 暫時返回 false（生產環境需要實現完整的密碼驗證）
    return false;
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
