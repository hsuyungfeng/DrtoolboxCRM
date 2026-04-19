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

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET environment variable is required. Please set it before starting the application.",
  );
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions,
    }),
    StaffModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
