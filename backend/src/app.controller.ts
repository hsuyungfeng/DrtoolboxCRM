import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller()
@ApiTags("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "歡迎訊息" })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  @ApiOperation({ summary: "健康檢查" })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
