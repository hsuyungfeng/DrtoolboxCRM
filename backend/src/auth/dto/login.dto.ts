import { IsString, IsNotEmpty, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "使用者名稱",
    example: "admin",
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "使用者名稱為必填" })
  @Length(3, 50, { message: "使用者名稱長度必須在 3-50 字符之間" })
  username: string;

  @ApiProperty({
    description: "密碼",
    example: "password123",
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: "密碼為必填" })
  @Length(6, 100, { message: "密碼長度必須在 6-100 字符之間" })
  password: string;

  @ApiProperty({
    description: "診所 ID",
    example: "clinic_001",
  })
  @IsString()
  @IsNotEmpty({ message: "診所 ID 為必填" })
  clinicId: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: "JWT 存取權杖" })
  accessToken: string;

  @ApiProperty({ description: "權杖類型" })
  tokenType: string;

  @ApiProperty({ description: "權杖過期時間（秒）" })
  expiresIn: number;

  @ApiProperty({ description: "使用者資訊" })
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    clinicId: string;
  };
}
