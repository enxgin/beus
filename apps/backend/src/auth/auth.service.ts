import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../prisma/prisma-types';
import { UsersService } from '../users/users.service';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    console.log(`Kullanıcı doğrulama işlemi başlıyor: ${email}`);
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.log(`Hata: ${email} e-posta adresi ile kullanıcı bulunamadı`);
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }
    
    console.log('Kullanıcı bulundu, şifre kontrol ediliyor...');
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('Hata: Geçersiz şifre');
        throw new UnauthorizedException('Geçersiz kimlik bilgileri');
      }
      
      console.log('Kimlik doğrulama başarılı');
      
      // Remove password from returned object
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      console.error('Kimlik doğrulama hatası:', error);
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }
  }

  async login(user: Omit<User, 'password'>) {
    console.log('Login için kullanıcı bilgileri:', JSON.stringify(user, null, 2));
    
    // Branch bilgisi varsa branch detaylarını da çek
    let branchDetails = null;
    if (user.branchId) {
      try {
        // Kullanıcının şubesini UsersService yardımcı metodu ile al
        const branch = await this.usersService.getBranchById(user.branchId);
        
        if (branch) {
          branchDetails = {
            id: branch.id,
            name: branch.name
          };
          console.log('Şube bilgileri bulundu:', branchDetails);
        }
      } catch (error) {
        console.error('Şube bilgileri alınırken hata oluştu:', error);
      }
    }
    
    // JWT için payload hazırla
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role, 
      name: user.name,
      branchId: user.branchId, // Doğrudan branchId ekle
      branch: branchDetails || (user.branchId ? { id: user.branchId } : null)
    };
    
    console.log('JWT token payload:', payload);
    
    // Kullanıcı yanıtı içinde branch bilgisini doğru formatta dön
    return {
      user: {
        ...user,
        branch: branchDetails || (user.branchId ? { id: user.branchId } : null)
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await this.hashPassword(password);
    return this.usersService.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.STAFF, // Default role for new users
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}



