import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLINIC_SCOPED_KEY } from '../decorators/clinic-scoped.decorator';

@Injectable()
export class ClinicGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isClinicScoped = this.reflector.getAllAndOverride<boolean>(
      CLINIC_SCOPED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isClinicScoped) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('用戶未認證');
    }

    // 從 request.clinicId (由 ClinicAuthMiddleware 設置) 或 header 獲取
    const requestClinicId = request.clinicId || request.headers['x-clinic-id'];
    const userClinicId = user.clinicId;

    if (!userClinicId && user.role !== 'super_admin') {
      throw new ForbiddenException('用戶無所屬診所且非超級管理員');
    }

    // 如果請求中沒有 clinicId，自動使用用戶所屬的 clinicId
    if (!requestClinicId) {
      request.clinicId = userClinicId;
      return true;
    }

    // 驗證一致性
    if (requestClinicId !== userClinicId && user.role !== 'super_admin') {
      throw new ForbiddenException(
        `權限不足：無法存取診所 ${requestClinicId} 的資料。您的所屬診所為 ${userClinicId}`,
      );
    }

    // 確保 request.clinicId 已設置，供後續 Controller 使用
    request.clinicId = requestClinicId;

    return true;
  }
}
