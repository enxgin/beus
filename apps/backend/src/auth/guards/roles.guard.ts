import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Eğer rol belirtilmemişse, herhangi bir rol erişim sağlayabilir
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Yönetici (ADMIN) her zaman tüm kaynaklara erişebilir
    if (user.role === 'ADMIN') {
      return true;
    }
    
    // Kullanıcının rolü gerekli rollerden biri mi kontrol et
    return requiredRoles.some((role) => user.role === role);
  }
}


