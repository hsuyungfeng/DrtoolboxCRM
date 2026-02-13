import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { StaffModule } from "../staff/staff.module";
import type { JwtSignOptions } from "@nestjs/jwt";

const signOptions = {
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
} as JwtSignOptions;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
      signOptions,
    }),
    StaffModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
