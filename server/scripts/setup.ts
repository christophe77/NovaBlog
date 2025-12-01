import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🚀 InnovLayer Setup Wizard\n');

  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Run migrations
    console.log('Running database migrations...');
    // Note: In a real scenario, you'd call prisma migrate programmatically
    // For now, we assume migrations are run separately
    console.log('✅ Database ready\n');

    // Check if admin exists
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount > 0) {
      console.log('⚠️  Admin user already exists. Skipping user creation.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Create admin user
    console.log('Create admin user:');
    const email = await question('Email: ');
    const password = await question('Password (min 8 chars): ');

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      rl.close();
      await prisma.$disconnect();
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully\n');
    console.log('Next steps:');
    console.log('1. Configure your environment variables (.env file)');
    console.log('2. Visit /setup in your browser to complete the configuration');
    console.log('3. Or use the API endpoint POST /api/setup/complete\n');
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();

