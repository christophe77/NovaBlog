import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/password.js';
import { isSetupComplete, markSetupComplete } from '../utils/setup.js';
import { z } from 'zod';

export const setupRoutes = Router();

const setupSchema = z.object({
  language: z.string().length(2),
  company: z.object({
    name: z.string().min(1),
    siren: z.string().optional(),
    address: z.string().optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    phone: z.string().optional(),
    logo: z.union([z.string().url(), z.literal('')]).optional(),
    activity: z.string().optional(),
    location: z.string().optional(),
  }),
  seo: z.object({
    globalKeywords: z.array(z.string()).optional(),
    metaDescription: z.string().optional(),
    siteTitle: z.string().optional(),
  }),
  theme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    accentColor: z.string().optional(),
  }),
  ai: z.object({
    model: z.string().optional(),
    tone: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
  }),
  admin: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

// Check if setup is needed
setupRoutes.get('/status', async (req, res) => {
  const complete = await isSetupComplete();
  res.json({ setupComplete: complete });
});

// Complete setup
setupRoutes.post('/complete', async (req, res) => {
  try {
    // Check if already setup
    const alreadySetup = await isSetupComplete();
    if (alreadySetup) {
      return res.status(400).json({ error: { message: 'Setup already completed' } });
    }

    const data = setupSchema.parse(req.body);

    // Create settings
    const settings = [
      { key: 'language.default', value: JSON.stringify(data.language), category: 'language' },
      { key: 'company.name', value: JSON.stringify(data.company.name), category: 'company' },
      { key: 'company.siren', value: JSON.stringify(data.company.siren || ''), category: 'company' },
      { key: 'company.address', value: JSON.stringify(data.company.address || ''), category: 'company' },
      { key: 'company.email', value: JSON.stringify(data.company.email || ''), category: 'company' },
      { key: 'company.phone', value: JSON.stringify(data.company.phone || ''), category: 'company' },
      { key: 'company.logo', value: JSON.stringify(data.company.logo || ''), category: 'company' },
      { key: 'company.activity', value: JSON.stringify(data.company.activity || ''), category: 'company' },
      { key: 'company.location', value: JSON.stringify(data.company.location || ''), category: 'company' },
      { key: 'seo.globalKeywords', value: JSON.stringify(data.seo.globalKeywords || []), category: 'seo' },
      { key: 'seo.metaDescription', value: JSON.stringify(data.seo.metaDescription || ''), category: 'seo' },
      { key: 'seo.siteTitle', value: JSON.stringify(data.seo.siteTitle || data.company.name), category: 'seo' },
      { key: 'theme.primaryColor', value: JSON.stringify(data.theme.primaryColor || '#2563eb'), category: 'theme' },
      { key: 'theme.secondaryColor', value: JSON.stringify(data.theme.secondaryColor || '#10b981'), category: 'theme' },
      { key: 'theme.backgroundColor', value: JSON.stringify(data.theme.backgroundColor || '#ffffff'), category: 'theme' },
      { key: 'theme.textColor', value: JSON.stringify(data.theme.textColor || '#1f2937'), category: 'theme' },
      { key: 'theme.accentColor', value: JSON.stringify(data.theme.accentColor || '#3b82f6'), category: 'theme' },
      { key: 'ai.model', value: JSON.stringify(data.ai.model || 'mistral-large-latest'), category: 'ai' },
      { key: 'ai.tone', value: JSON.stringify(data.ai.tone || 'technique mais accessible'), category: 'ai' },
      { key: 'ai.length', value: JSON.stringify(data.ai.length || 'medium'), category: 'ai' },
      { key: 'blog.topics', value: JSON.stringify([]), category: 'blog' },
      { key: 'blog.keywords', value: JSON.stringify([]), category: 'blog' },
    ];

    await Promise.all(
      settings.map((s) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value, category: s.category },
          create: s,
        })
      )
    );

    // Create admin user
    const passwordHash = await hashPassword(data.admin.password);
    await prisma.user.create({
      data: {
        email: data.admin.email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Mark setup as complete
    await markSetupComplete();

    res.json({ success: true, message: 'Setup completed successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(400).json({ error: { message: 'Invalid setup data' } });
  }
});

