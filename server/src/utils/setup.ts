import { prisma } from '../lib/prisma.js';

export async function isSetupComplete(): Promise<boolean> {
  try {
    // Check if admin user exists
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    // Check if basic settings exist
    const settingsCount = await prisma.setting.count({
      where: {
        key: {
          in: ['company.name', 'language.default'],
        },
      },
    });

    return adminCount > 0 && settingsCount >= 2;
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  }
}

export async function markSetupComplete(): Promise<void> {
  await prisma.setting.upsert({
    where: { key: 'setup.completed' },
    update: { value: JSON.stringify(true) },
    create: {
      key: 'setup.completed',
      value: JSON.stringify(true),
      category: 'system',
    },
  });
}

