const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default owner if doesn't exist
  const existingOwner = await prisma.owner.findUnique({
    where: { email: 'admin@fleet.com' },
  });

  if (!existingOwner) {
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    await prisma.owner.create({
      data: {
        name: 'Fleet Admin',
        email: 'admin@fleet.com',
        phone: '9876543210',
        businessName: 'Demo Fleet',
        password: hashedPassword,
        role: 'owner',
      },
    });
    console.log('✓ Default owner created: admin@fleet.com / admin123456');
  } else {
    console.log('✓ Default owner already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
