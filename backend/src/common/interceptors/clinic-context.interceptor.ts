import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ClinicContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clinicId = request.headers['x-clinic-id'] || request.query.clinicId;

    if (!user && !this.isPublicRoute(request.path)) {
      return next.handle();
    }

    if (user && user.clinicId) {
      if (!clinicId) {
        request.headers['x-clinic-id'] = user.clinicId;
      } else if (clinicId !== user.clinicId && user.role !== 'super_admin') {
        throw new ForbiddenException(
          `無法訪問診所 ${clinicId} 的資料`
        );
      }
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`${request.method} ${request.path} - ${duration}ms`);
        }
      }),
    );
  }

  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/health',
      '/api-docs',
    ];
    return publicRoutes.some(route => path.startsWith(route));
  }
}
