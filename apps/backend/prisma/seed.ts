import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed verilerini oluşturuyor...');

  // Şubeleri oluştur
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-1' },
    update: {},
    create: {
      id: 'branch-1',
      name: 'Ana Şube',
      address: 'İstanbul, Türkiye',
      phone: '+90 212 123 45 67',
      description: 'Ana şube lokasyonu',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-2' },
    update: {},
    create: {
      id: 'branch-2',
      name: 'Şube 2',
      address: 'Ankara, Türkiye',
      phone: '+90 312 123 45 67',
      description: 'İkinci şube lokasyonu',
    },
  });

  // Şifreyi hash'le
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Admin kullanıcısı
  const admin = await prisma.user.upsert({
    where: { email: 'test-admin@salonflow.com' },
    update: {},
    create: {
      email: 'test-admin@salonflow.com',
      name: 'Test Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
      branchId: branch1.id,
    },
  });

  // Branch Manager kullanıcısı
  const branchManager = await prisma.user.upsert({
    where: { email: 'mert@a.com' },
    update: {},
    create: {
      email: 'mert@a.com',
      name: 'Mert',
      password: hashedPassword,
      role: UserRole.BRANCH_MANAGER,
      branchId: branch2.id,
    },
  });

  // Staff kullanıcısı
  const staff = await prisma.user.upsert({
    where: { email: 'staff@salonflow.com' },
    update: {},
    create: {
      email: 'staff@salonflow.com',
      name: 'Test Staff',
      password: hashedPassword,
      role: UserRole.STAFF,
      branchId: branch1.id,
    },
  });

  // Hizmet kategorileri oluştur
  const serviceCategory = await prisma.serviceCategory.upsert({
    where: { id: 'category-1' },
    update: {},
    create: {
      id: 'category-1',
      name: 'Saç Bakımı',
      description: 'Saç kesimi ve bakım hizmetleri',
    },
  });

  // Hizmetler oluştur
  const service1 = await prisma.service.upsert({
    where: { id: 'service-1' },
    update: {},
    create: {
      id: 'service-1',
      name: 'Saç Kesimi',
      price: 150.0,
      duration: 60,
      description: 'Profesyonel saç kesimi',
      categoryId: serviceCategory.id,
      branchId: branch1.id,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { id: 'service-2' },
    update: {},
    create: {
      id: 'service-2',
      name: 'Saç Boyama',
      price: 300.0,
      duration: 120,
      description: 'Profesyonel saç boyama',
      categoryId: serviceCategory.id,
      branchId: branch1.id,
    },
  });

  // Müşteriler oluştur
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cmcwuql1f0002sbjrl10yvy76' },
    update: {},
    create: {
      id: 'cmcwuql1f0002sbjrl10yvy76',
      name: 'Ayşe Yılmaz',
      phone: '+90 555 123 45 67',
      email: 'ayse@example.com',
      branchId: branch1.id,
      discountRate: 10,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      name: 'Mehmet Demir',
      phone: '+90 555 987 65 43',
      email: 'mehmet@example.com',
      branchId: branch1.id,
      discountRate: 5,
    },
  });

  // Randevular oluştur
  const appointment1 = await prisma.appointment.upsert({
    where: { id: 'appointment-1' },
    update: {},
    create: {
      id: 'appointment-1',
      startTime: new Date('2025-07-15T10:00:00Z'),
      endTime: new Date('2025-07-15T11:00:00Z'),
      status: 'COMPLETED',
      notes: 'Müşteri memnun kaldı',
      customerId: customer1.id,
      serviceId: service1.id,
      staffId: staff.id,
      branchId: branch1.id,
    },
  });

  const appointment2 = await prisma.appointment.upsert({
    where: { id: 'appointment-2' },
    update: {},
    create: {
      id: 'appointment-2',
      startTime: new Date('2025-07-20T14:00:00Z'),
      endTime: new Date('2025-07-20T16:00:00Z'),
      status: 'SCHEDULED',
      notes: 'Saç boyama randevusu',
      customerId: customer1.id,
      serviceId: service2.id,
      staffId: staff.id,
      branchId: branch1.id,
    },
  });

  // Paketler oluştur
  const package1 = await prisma.package.upsert({
    where: { id: 'package-1' },
    update: {},
    create: {
      id: 'package-1',
      name: 'Saç Bakım Paketi',
      price: 500.0,
      type: 'SESSION',
      totalSessions: 5,
      validityDays: 90,
      description: '5 seans saç bakım paketi',
      branchId: branch1.id,
    },
  });

  // Müşteri paketleri oluştur
  const customerPackage1 = await prisma.customerPackage.upsert({
    where: { id: 'customer-package-1' },
    update: {},
    create: {
      id: 'customer-package-1',
      purchaseDate: new Date('2025-07-01T00:00:00Z'),
      expiryDate: new Date('2025-09-29T23:59:59Z'),
      remainingSessions: { 'service-1': 3, 'service-2': 2 },
      customerId: customer1.id,
      packageId: package1.id,
      salesCode: 'PKG-001',
    },
  });

  // Faturalar oluştur
  const invoice1 = await prisma.invoice.upsert({
    where: { id: 'invoice-1' },
    update: {},
    create: {
      id: 'invoice-1',
      totalAmount: 150.0,
      amountPaid: 150.0,
      debt: 0.0,
      status: 'PAID',
      customerId: customer1.id,
      branchId: branch1.id,
      appointmentId: appointment1.id,
    },
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { id: 'invoice-2' },
    update: {},
    create: {
      id: 'invoice-2',
      totalAmount: 500.0,
      amountPaid: 500.0,
      debt: 0.0,
      status: 'PAID',
      customerId: customer1.id,
      branchId: branch1.id,
      customerPackageId: customerPackage1.id,
    },
  });

  // Ödemeler oluştur
  const payment1 = await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      amount: 150.0,
      method: 'CASH',
      paymentDate: new Date('2025-07-15T11:00:00Z'),
      invoiceId: invoice1.id,
    },
  });

  const payment2 = await prisma.payment.upsert({
    where: { id: 'payment-2' },
    update: {},
    create: {
      id: 'payment-2',
      amount: 500.0,
      method: 'CREDIT_CARD',
      paymentDate: new Date('2025-07-01T12:00:00Z'),
      invoiceId: invoice2.id,
    },
  });

  console.log('Seed verileri başarıyla oluşturuldu:');
  console.log('- Admin:', admin.email);
  console.log('- Branch Manager:', branchManager.email);
  console.log('- Staff:', staff.email);
  console.log('- Şifre (hepsi için): 123456');
  console.log('- Müşteriler: 2 adet');
  console.log('- Randevular: 2 adet');
  console.log('- Paketler: 1 adet');
  console.log('- Ödemeler: 2 adet');
}

main()
  .catch((e) => {
    console.error('Seed işlemi sırasında bir hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma bağlantısı kesildi.');
  });
