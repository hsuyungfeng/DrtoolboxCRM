import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";

export const IS_PUBLIC_KEY = "isPublic";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 優先檢查是否標記為公開路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. 檢查受信任整合模式 (App Integration)
    const request = context.switchToHttp().getRequest();
    const appKey = request.headers['x-app-key'];
    const trustedKey = process.env.TRUSTED_APP_KEY || 'drtoolbox_local_secret_2026';
    const clinicId = request.headers['x-clinic-id'] || request.query.clinicId;

    if (appKey && appKey === trustedKey) {
      // 成功匹配整合金鑰：手動注入 User 物件並放行
      request.user = {
        sub: 'system-integration',
        username: 'AppIntegration',
        name: '整合模式',
        role: 'admin',
        clinicId: clinicId || 'clinic_001',
      };
      return true;
    }

    // 3. 常規 JWT 驗證
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (err) {
      // 如果 JWT 驗證失敗，但我們有 App Key (雖然上面已經檢查過，但為保險起見)，
      // 這裡再次檢查，防止 super.canActivate 的報錯直接中斷流程
      if (appKey && appKey === trustedKey) {
        return true;
      }
      throw err;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 取得請求對象，檢查是否有被 canActivate 注入 user
    const request = context.switchToHttp().getRequest();
    if (request.user) {
      return request.user;
    }

    if (err || !user) {
      throw err || new UnauthorizedException("請先登入");
    }
    return user;
  }
}
