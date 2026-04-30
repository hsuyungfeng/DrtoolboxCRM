import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, LoginResponseDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";
import { JwtPayload } from "./strategies/jwt.strategy";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "使用者登入" })
  @ApiResponse({
    status: 200,
    description: "登入成功",
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: "使用者名稱或密碼錯誤" })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get("sso")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "透過 Doctor Toolbox SSO 登入" })
  async sso(
    @Query("clinicId") clinicId: string,
    @Query("staffId") staffId: string,
    @Query("ts") ts: string,
    @Query("sig") sig: string,
    @Query("name") name?: string,
    @Query("role") role?: string,
  ): Promise<LoginResponseDto> {
    return this.authService.loginViaToolbox(clinicId, staffId, ts, sig, name, role);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "取得當前使用者資訊" })
  @ApiResponse({ status: 200, description: "成功取得使用者資訊" })
  @ApiResponse({ status: 401, description: "未授權" })
  async getProfile(@Request() req: { user: JwtPayload }) {
    return {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role,
      clinicId: req.user.clinicId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  @ApiBearerAuth()
  @ApiOperation({ summary: "刷新權杖" })
  @ApiResponse({ status: 200, description: "成功刷新權杖" })
  @ApiResponse({ status: 401, description: "未授權" })
  async refreshToken(@Request() req: { user: JwtPayload }) {
    const newToken = await this.authService.refreshToken(req.user);
    return {
      accessToken: newToken,
      tokenType: "Bearer",
    };
  }
}
