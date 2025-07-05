import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Veritabanından kullanıcı bilgilerini al
    const user = await this.usersService.findOne(payload.sub);
    
    // Kullanıcı bilgilerini döndürürken, branch bilgisinin doğru formatta olduğundan emin ol
    // Bu, CustomersController'da user?.branch?.id erişimini çalıştıracak
    return { 
      ...user,
      userId: payload.sub,
      // Şube bilgisini düzgün formatta ekle
      branch: user.branchId ? { id: user.branchId } : null
    };
  }
}
