import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const CLINIC_ID_KEY = 'clinicId';

@Injectable()
export class ClinicContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('用戶未認證');
    }

    const requestClinicId = request.headers['x-clinic-id'];
    const userClinicId = user.clinicId;

    if (!userClinicId) {
      throw new ForbiddenException('用戶無所屬診所');
    }

    if (requestClinicId && requestClinicId !== userClinicId) {
      const isSuperAdmin = user.role === 'super_admin';
      
      if (!isSuperAdmin) {
        throw new ForbiddenException(
          `無法訪問診所 ${requestClinicId} 的資料。您所屬的診所是 ${userClinicId}`
        );
      }
    }

    if (!requestClinicId) {
      request.headers['x-clinic-id'] = userClinicId;
    }

    return true;
  }
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => (target: any, key: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(IS_PUBLIC_KEY, true, descriptor.value);
  return descriptor;
};
