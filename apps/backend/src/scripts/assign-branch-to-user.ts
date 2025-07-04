import { PrismaClient } from '@prisma/client';

// Bu script bir kullanıcıya şube atamak için kullanılır
async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Önce tüm şubeleri listeleyelim
    const branches = await prisma.branch.findMany();
    console.log('Mevcut şubeler:', branches);
    
    if (branches.length === 0) {
      console.log('Hiç şube bulunamadı. Önce bir şube oluşturun.');
      return;
    }
    
    // Kullanıcımızı bulalım
    const user = await prisma.user.findUnique({
      where: { email: 'admin@salonflow.com' }
    });
    
    if (!user) {
      console.log('admin@salonflow.com kullanıcısı bulunamadı.');
      return;
    }
    
    console.log('Kullanıcı bulundu:', user);
    
    // Kullanıcıya ilk şubeyi atayalım
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { branchId: branches[0].id }
    });
    
    console.log(`Kullanıcıya şube atandı: ${branches[0].name} (${branches[0].id})`);
    console.log('Güncel kullanıcı bilgileri:', updatedUser);
    
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
