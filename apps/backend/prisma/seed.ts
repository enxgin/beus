import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- DEĞİŞTİRİLECEK ALANLAR ---
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'SecureAdminPassword123!';
const ADMIN_NAME = 'Admin';
// --------------------------------

async function main() {
  console.log('Seeding started...');

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: UserRole.ADMIN, // UserRole enum'ınızda ADMIN değeri olduğunu varsayıyorum
    },
  });

  console.log(`Admin user created/updated: ${adminUser.email}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
