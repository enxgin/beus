import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Bu script bir test kullanıcısı oluşturmak için kullanılır
async function main() {
  const prisma = new PrismaClient();
  try {
    // Kullanıcı daha önce var mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@salonflow.com' }
    });

    if (existingUser) {
      console.log('Bu email ile bir kullanıcı zaten var, kullanıcıyı güncelliyoruz...');
      // Kullanıcı var, şifreyi güncelle
      const hashedPassword = await bcrypt.hash('test123', 10);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      });
      console.log('Kullanıcı şifresi güncellendi: admin@salonflow.com / test123');
    } else {
      // Yeni kullanıcı oluştur
      const hashedPassword = await bcrypt.hash('test123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'admin@salonflow.com',
          name: 'Admin Kullanıcı',
          password: hashedPassword,
          role: 'ADMIN',
        }
      });
      console.log('Yeni kullanıcı oluşturuldu:', user.email);
    }
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
