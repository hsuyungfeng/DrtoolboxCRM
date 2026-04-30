import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";

@Controller()
@ApiTags("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: "歡迎訊息" })
  getHello(): string {
    return this.appService.getHello();
  }

  @SkipThrottle()
  @Get("health")
  @ApiOperation({ summary: "健康檢查" })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
