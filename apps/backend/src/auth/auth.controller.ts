import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({ status: 200, description: 'Başarılı giriş ve JWT token dönüşü' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      return this.authService.login(user);
    } catch (error) {
      console.error('Login hatası:', error.message);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Yeni personel kaydı' })
  @ApiResponse({ status: 201, description: 'Başarılı kayıt' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    const user = await this.authService.register(email, password, name);
    return { message: 'Kullanıcı başarıyla oluşturuldu', userId: user.id };
  }

  @ApiOperation({ summary: 'Mevcut kullanıcı profilini getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı profili' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
