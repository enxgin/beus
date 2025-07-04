import { PrismaClient } from '../src/prisma/client';
import { UserRole } from '../src/prisma/prisma-types';
import * as bcrypt from 'bcrypt';
import { fakerTR as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Başlangıç verilerini oluşturma işlemi başladı...');

  // Test kullanıcılarını kontrol et
  const existingTestAdmin = await prisma.user.findFirst({
    where: { email: 'test-admin@salonflow.com' },
  });

  // Önceden var olan admin kullanıcısını kontrol et
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, email: 'admin@salonflow.com' },
  });

  // Eğer admin yoksa oluştur
  if (!existingAdmin) {
    // Admin şifresini hashle
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Ana şubeyi oluştur
    const branch = await prisma.branch.create({
      data: {
        name: 'Ana Şube',
        address: 'Merkez Mah. Atatürk Cad. No:1, İstanbul',
        phone: '+905551234567',
        // description alanı Branch modelinde bulunmuyor
      },
    });

    console.log(`Ana şube oluşturuldu: ${branch.name}`);

    // Admin kullanıcısını oluştur
    const admin = await prisma.user.create({
      data: {
        email: 'admin@salonflow.com',
        password: hashedPassword,
        name: 'Admin User', // firstName ve lastName yerine name alanı kullanılıyor
        role: UserRole.ADMIN,
        branchId: branch.id,
      },
    });

    console.log(`Admin kullanıcısı oluşturuldu: ${admin.email}`);

    // Örnek bir kategori ve hizmet oluştur
    const category = await prisma.serviceCategory.create({
      data: {
        name: 'Saç Bakımı',
      },
    });

    await prisma.service.create({
      data: {
        name: 'Saç Kesimi',
        type: 'TIME_BASED',
        duration: 30,
        price: 150,
        commissionRate: 0.1,
        categoryId: category.id,
        branchId: branch.id,
      },
    });

    console.log('Örnek kategori ve hizmet oluşturuldu');
  } else {
    console.log('Admin kullanıcısı zaten mevcut, seed işlemi atlanıyor');
  }

  // Müşteri tohumlama kontrolü
  const customerCount = await prisma.customer.count();
  const desiredCustomerCount = 50;

  if (customerCount < desiredCustomerCount) {
    const customersToCreate = desiredCustomerCount - customerCount;
    console.log(`${customersToCreate} adet yeni müşteri oluşturulacak...`);

    const mainBranch = await prisma.branch.findFirst({ where: { name: 'Ana Şube' } });
    if (!mainBranch) {
      throw new Error('Ana Şube bulunamadı. Müşteri oluşturma işlemi başarısız.');
    }

    const customerDataList = Array.from({ length: customersToCreate }).map(() => ({
      name: faker.person.firstName() + ' ' + faker.person.lastName(),
      phone: faker.phone.number().replace(/\D/g, '').slice(0, 15),
      email: faker.internet.email().toLowerCase(),
      creditBalance: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
      branchId: mainBranch.id,
      notes: faker.lorem.sentence(),
    }));

    await prisma.customer.createMany({
      data: customerDataList,
      skipDuplicates: true,
    });

    console.log(`${customersToCreate} adet müşteri başarıyla oluşturuldu.`);
  } else {
    console.log('Yeterli sayıda müşteri zaten mevcut, oluşturma işlemi atlanıyor.');
  }

  // Test kullanıcılarını oluştur
  if (!existingTestAdmin) {
    // Sabit bir test şifre kullanalım
    const salt = await bcrypt.genSalt();
    const testPassword = await bcrypt.hash('SalonFlow2025!', salt);
    
    // Ana şubeyi kullanalım
    const mainBranch = await prisma.branch.findFirst();
    if(!mainBranch) throw new Error('Ana şube bulunamadı');
    
    // Diğer şubeleri oluştur
    const branches = [];
    for(let i = 1; i <= 3; i++) {
      const branch = await prisma.branch.create({
        data: {
          name: `Şube ${i}`,
          address: `Test Mah. Test Cad. No:${i}, İstanbul`,
          phone: `+9055512345${i}${i}`,
        },
      });
      branches.push(branch);
      console.log(`Şube oluşturuldu: ${branch.name}`);
    }
    
    // Test kullanıcıları oluştur
    const roles = Object.values(UserRole);
    
    for (const role of roles) {
      let branchId = null;
      
      // Role göre şube ataması yap
      if (role === UserRole.ADMIN) {
        branchId = null; // Admin tüm şubelere erişebilir
      } else if (role === UserRole.SUPER_BRANCH_MANAGER) {
        branchId = mainBranch.id;
      } else {
        // Diğer roller için rastgele bir şube seç
        const randomBranch = branches[Math.floor(Math.random() * branches.length)];
        branchId = randomBranch.id;
      }
      
      // Test kullanıcısını ekle
      const testUser = await prisma.user.create({
        data: {
          email: `test-${String(role).toLowerCase()}@salonflow.com`,
          password: testPassword,
          name: `Test ${String(role).charAt(0) + String(role).slice(1).toLowerCase()}`,
          role: role,
          branchId: branchId,
        },
      });
      
      console.log(`Test kullanıcısı oluşturuldu: ${testUser.email} (${role})`);
    }
    
    console.log('Tüm test kullanıcıları oluşturuldu');
  } else {
    console.log('Test kullanıcıları zaten mevcut, bu aşama atlanıyor');
  }
  
  console.log('Başlangıç verileri başarıyla oluşturuldu');
}

main()
  .catch((e) => {
    console.error('Seed işlemi sırasında hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
