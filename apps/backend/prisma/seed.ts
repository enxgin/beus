import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Tohumlama işlemi başlıyor: Tüm veriler silinecek ve başlangıç verileri oluşturulacak...');

  // 1. Tüm verileri temizle (doğru sırada)
  console.log('Mevcut veriler temizleniyor...');
  // İlişkisel olarak bağımlı olanlardan başla
  await prisma.appointment.deleteMany({});
  await prisma.customerTag.deleteMany({});
  // await prisma.CustomerPackage.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  console.log('Tüm eski veriler başarıyla silindi.');

  // 2. Şubeleri oluştur
  console.log('Yeni şubeler oluşturuluyor...');
  const branch2 = await prisma.branch.create({
    data: {
      name: 'Şube 2',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
    },
  });
  const branch3 = await prisma.branch.create({
    data: {
      name: 'Şube 3',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
    },
  });
  console.log(`Şubeler oluşturuldu: ${branch2.name}, ${branch3.name}`);

  // 3. Kullanıcıları oluştur
  console.log('Kullanıcılar oluşturuluyor...');
  const password = '66666666';
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const usersToCreate = [
    { email: 'test-admin@salonflow.com', name: 'Test Admin', role: UserRole.ADMIN, branchId: null },
    { email: 'ali@a.com', name: 'Ali', role: UserRole.STAFF, branchId: branch2.id },
    { email: 'deniz@a.com', name: 'Deniz', role: UserRole.RECEPTION, branchId: branch2.id },
    { email: 'cansu@a.com', name: 'Cansu', role: UserRole.STAFF, branchId: branch2.id },
    { email: 'mert@a.com', name: 'Mert', role: UserRole.BRANCH_MANAGER, branchId: branch2.id },
    { email: 'cengiz@c.com', name: 'Cengiz', role: UserRole.STAFF, branchId: branch3.id },
    { email: 'nergiz@c.com', name: 'Nergiz', role: UserRole.BRANCH_MANAGER, branchId: branch3.id },
  ];

  for (const userData of usersToCreate) {
    await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
  }
  console.log(`${usersToCreate.length} kullanıcı başarıyla oluşturuldu.`);

  // 4. Müşterileri oluştur
  console.log('Rastgele müşteriler oluşturuluyor...');
  const customers = [];
  for (let i = 0; i < 10; i++) {
    customers.push({
      name: faker.person.fullName(),
      phone: `053${faker.string.numeric(8)}`,
      branchId: branch2.id,
    });
    customers.push({
      name: faker.person.fullName(),
      phone: `054${faker.string.numeric(8)}`,
      branchId: branch3.id,
    });
  }
  await prisma.customer.createMany({ data: customers });
  console.log(`${customers.length} rastgele müşteri oluşturuldu.`);

  // 5. Hizmet Kategorileri ve Hizmetleri Oluştur
  console.log('Hizmet kategorileri ve hizmetler oluşturuluyor...');
  const sampleCategories = ['Saç Kesim & Boya', 'Cilt Bakımı', 'El & Ayak Bakımı', 'Makyaj', 'Vücut Bakımı', 'Epilasyon'];

  // Şube 2 için
  for (let i = 0; i < 4; i++) {
    const category = await prisma.serviceCategory.create({
      data: {
        name: `${faker.helpers.arrayElement(sampleCategories)} - Şube 2`,
        branchId: branch2.id,
      },
    });
    await prisma.service.create({
      data: {
        name: `${faker.commerce.productName()}`,
        type: 'TIME_BASED',
        duration: faker.helpers.arrayElement([30, 45, 60, 90]),
        price: faker.number.int({ min: 100, max: 1500 }),
        commissionRate: 0.1,
        categoryId: category.id,
        branch: {
          connect: { id: branch2.id }
        },
      },
    });
  }
  console.log(`Şube 2 için 4 kategori ve 4 hizmet oluşturuldu.`);

  // Şube 3 için
  for (let i = 0; i < 4; i++) {
    const category = await prisma.serviceCategory.create({
      data: {
        name: `${faker.helpers.arrayElement(sampleCategories)} - Şube 3`,
        branchId: branch3.id,
      },
    });
    await prisma.service.create({
      data: {
        name: `${faker.commerce.productName()}`,
        type: 'TIME_BASED',
        duration: faker.helpers.arrayElement([30, 45, 60, 90]),
        price: faker.number.int({ min: 100, max: 1500 }),
        commissionRate: 0.1,
        categoryId: category.id,
        branch: {
          connect: { id: branch3.id }
        },
      },
    });
  }
  console.log(`Şube 3 için 4 kategori ve 4 hizmet oluşturuldu.`);

  console.log('Tohumlama işlemi başarıyla tamamlandı!');
}

main()
  .catch((e) => {
    console.error('Tohumlama sırasında bir hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma bağlantısı kesildi.');
  });