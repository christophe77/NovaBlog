import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { articleSchema, generateArticleSchema } from '../utils/validation.js';
import { mistralService } from '../services/mistral.js';
import { generateSlug } from '../utils/slug.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateScheduledArticle } from '../services/scheduler.js';
import { upload } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export const adminRoutes = Router();

// Get current admin user
adminRoutes.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Articles routes
adminRoutes.get('/articles', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.article.count({ where }),
    ]);

    res.json({
      articles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.get('/articles/:id', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: { message: 'Article not found' } });
    }

    res.json({ article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.post('/articles', async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const slug = generateSlug(data.title);
    
    // Ensure unique slug
    const existing = await prisma.article.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const article = await prisma.article.create({
      data: {
        ...data,
        slug: finalSlug,
        keywords: data.keywords ? JSON.stringify(data.keywords) : null,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : data.publishedAt ? new Date(data.publishedAt) : null,
        source: 'MANUAL',
      },
    });

    res.status(201).json({ article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(400).json({ error: { message: 'Invalid request' } });
  }
});

adminRoutes.put('/articles/:id', async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const existing = await prisma.article.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Article not found' } });
    }

    // Update slug if title changed
    let slug = existing.slug;
    if (data.title !== existing.title) {
      slug = generateSlug(data.title);
      const slugExists = await prisma.article.findUnique({ where: { slug } });
      if (slugExists && slugExists.id !== req.params.id) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        ...data,
        slug,
        keywords: data.keywords ? JSON.stringify(data.keywords) : existing.keywords,
        publishedAt: data.status === 'PUBLISHED' && !existing.publishedAt 
          ? new Date() 
          : data.publishedAt ? new Date(data.publishedAt) : existing.publishedAt,
      },
    });

    res.json({ article });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(400).json({ error: { message: 'Invalid request' } });
  }
});

adminRoutes.delete('/articles/:id', async (req, res) => {
  try {
    await prisma.article.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.post('/articles/:id/publish', async (req, res) => {
  try {
    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    res.json({ article });
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.post('/articles/:id/regenerate', aiRateLimiter, async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: { message: 'Article not found' } });
    }

    // Get settings for context
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'company.name',
            'company.activity',
            'company.location',
            'seo.globalKeywords',
            'ai.tone',
            'ai.length',
            'ai.apiKey',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Get API key from settings
    let apiKey: string | undefined;
    const apiKeySetting = settingsMap.get('ai.apiKey');
    if (apiKeySetting) {
      try {
        apiKey = JSON.parse(apiKeySetting);
      } catch {
        apiKey = apiKeySetting;
      }
    }

    const keywords = article.keywords ? JSON.parse(article.keywords) : [];
    const globalKeywords = JSON.parse(settingsMap.get('seo.globalKeywords') || '[]');

    const articleData = await mistralService.generateArticle(
      {
        topic: article.title,
        keywords,
        language: article.language,
        companyInfo: {
          name: JSON.parse(settingsMap.get('company.name') || 'null'),
          activity: JSON.parse(settingsMap.get('company.activity') || 'null'),
          location: JSON.parse(settingsMap.get('company.location') || 'null'),
        },
        seoConfig: { globalKeywords },
        tone: JSON.parse(settingsMap.get('ai.tone') || '"technique mais accessible"'),
        length: (JSON.parse(settingsMap.get('ai.length') || '"medium"') as 'short' | 'medium' | 'long'),
      },
      apiKey
    );

    const updated = await prisma.article.update({
      where: { id: req.params.id },
      data: {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        seoTitle: articleData.seoTitle,
        seoDescription: articleData.seoDescription,
        aiPrompt: article.aiPrompt || `Regenerate: ${article.title}`,
        aiModel: process.env.MISTRAL_MODEL || 'mistral-large-latest',
      },
    });

    res.json({ article: updated });
  } catch (error) {
    console.error('Regenerate article error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Settings routes
adminRoutes.get('/settings', async (req, res) => {
  try {
    const { category } = req.query;
    
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    // Group by category
    const grouped: Record<string, Record<string, any>> = {};
    settings.forEach((setting) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      // Extract the key part after the category prefix (e.g., "primaryColor" from "theme.primaryColor")
      const keyParts = setting.key.split('.');
      const keyWithoutCategory = keyParts.length > 1 ? keyParts.slice(1).join('.') : setting.key;
      try {
        grouped[setting.category][keyWithoutCategory] = JSON.parse(setting.value);
      } catch {
        grouped[setting.category][keyWithoutCategory] = setting.value;
      }
    });

    res.json({ settings: grouped });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: { message: 'Invalid request' } });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const category = key.split('.')[0] || 'general';
      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: {
            value: JSON.stringify(value),
            category,
          },
          create: {
            key,
            value: JSON.stringify(value),
            category,
          },
        })
      );
    }

    await Promise.all(updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// AI routes
adminRoutes.post('/ai/generate-article', aiRateLimiter, async (req, res) => {
  try {
    const params = generateArticleSchema.parse(req.body);

    // Get settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'company.name',
            'company.activity',
            'company.location',
            'seo.globalKeywords',
            'ai.tone',
            'ai.length',
            'ai.apiKey',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
    
    // Get API key from settings
    let apiKey: string | undefined;
    const apiKeySetting = settingsMap.get('ai.apiKey');
    if (apiKeySetting) {
      try {
        apiKey = JSON.parse(apiKeySetting);
      } catch {
        apiKey = apiKeySetting;
      }
    }

    const articleData = await mistralService.generateArticle(
      {
        ...params,
        companyInfo: {
          name: JSON.parse(settingsMap.get('company.name') || 'null'),
          activity: JSON.parse(settingsMap.get('company.activity') || 'null'),
          location: JSON.parse(settingsMap.get('company.location') || 'null'),
        },
        seoConfig: {
          globalKeywords: JSON.parse(settingsMap.get('seo.globalKeywords') || '[]'),
        },
        tone: JSON.parse(settingsMap.get('ai.tone') || '"technique mais accessible"'),
        length: (JSON.parse(settingsMap.get('ai.length') || '"medium"') as 'short' | 'medium' | 'long'),
      },
      apiKey
    );

    res.json({ article: articleData });
  } catch (error) {
    console.error('Generate article error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Dashboard stats
adminRoutes.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalArticles, publishedArticles, draftArticles, lastTask] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.scheduledTask.findFirst({
        where: { type: 'article_generation' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      stats: {
        totalArticles,
        publishedArticles,
        draftArticles,
        lastGeneration: lastTask
          ? {
              status: lastTask.status,
              completedAt: lastTask.completedAt,
              error: lastTask.error,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Manual trigger for article generation
adminRoutes.post('/scheduler/generate-now', aiRateLimiter, async (req, res) => {
  try {
    // Run generation in background
    generateScheduledArticle().catch(console.error);
    
    res.json({ success: true, message: 'Article generation started' });
  } catch (error) {
    console.error('Manual generation error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Upload article image
adminRoutes.post('/upload/article-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload article image error:', error);
    res.status(500).json({ error: { message: error.message || 'Upload failed' } });
  }
});

// Upload logo
adminRoutes.post('/upload/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fileUrl = `/uploads/${req.file.filename}`;

    // Get old logo before updating
    const oldLogoSetting = await prisma.setting.findUnique({
      where: { key: 'company.logo' },
    });

    // Update company.logo setting
    await prisma.setting.upsert({
      where: { key: 'company.logo' },
      update: {
        value: JSON.stringify(fileUrl),
        category: 'company',
      },
      create: {
        key: 'company.logo',
        value: JSON.stringify(fileUrl),
        category: 'company',
      },
    });

    // Delete old logo if it exists and is a local file
    if (oldLogoSetting) {
      try {
        const oldValue = JSON.parse(oldLogoSetting.value);
        if (oldValue && oldValue.startsWith('/uploads/') && oldValue !== fileUrl) {
          const oldFilePath = path.join(__dirname, '../../', oldValue);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } catch {
        // Ignore errors when deleting old file
      }
    }

    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: { message: 'Upload failed' } });
  }
});

// Homepage configuration routes
adminRoutes.get('/homepage/config', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'homepage.config' },
    });

    if (!setting) {
      // Return default config
      return res.json({
        config: {
          heroCarousel: {
            enabled: false,
            slides: [],
          },
          sections: [],
          contact: {
            enabled: false,
            title: 'Contactez-nous',
            description: '',
            emailLabel: 'Email',
            nameLabel: 'Nom',
            subjectLabel: 'Sujet',
            messageLabel: 'Message',
            submitLabel: 'Envoyer',
            successMessage: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
          },
          seo: {
            title: '',
            description: '',
          },
        },
      });
    }

    try {
      const config = JSON.parse(setting.value);
      res.json({ config });
    } catch {
      res.json({
        config: {
          heroCarousel: {
            enabled: false,
            slides: [],
          },
          sections: [],
          contact: {
            enabled: false,
            title: 'Contactez-nous',
            description: '',
            emailLabel: 'Email',
            nameLabel: 'Nom',
            subjectLabel: 'Sujet',
            messageLabel: 'Message',
            submitLabel: 'Envoyer',
            successMessage: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
          },
          seo: {
            title: '',
            description: '',
          },
        },
      });
    }
  } catch (error) {
    console.error('Get homepage config error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

adminRoutes.put('/homepage/config', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: { message: 'Invalid request' } });
    }

    await prisma.setting.upsert({
      where: { key: 'homepage.config' },
      update: {
        value: JSON.stringify(config),
        category: 'homepage',
      },
      create: {
        key: 'homepage.config',
        value: JSON.stringify(config),
        category: 'homepage',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update homepage config error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Generate alt text for homepage carousel image
adminRoutes.post('/homepage/generate-alt', aiRateLimiter, async (req, res) => {
  try {
    const { imageUrl, pageSection } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: { message: 'imageUrl is required' } });
    }

    // Get company settings for context
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['company.name', 'company.activity', 'homepage.config'],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    let existingContent = '';
    try {
      const homepageConfig = JSON.parse(settingsMap.get('homepage.config') || '{}');
      if (homepageConfig.sections && Array.isArray(homepageConfig.sections)) {
        existingContent = homepageConfig.sections
          .map((s: any) => s.content || '')
          .join(' ')
          .substring(0, 500);
      }
    } catch {
      // Ignore errors
    }

    const altText = await mistralService.generateImageAlt(
      imageUrl,
      {
        companyName: JSON.parse(settingsMap.get('company.name') || 'null'),
        companyActivity: JSON.parse(settingsMap.get('company.activity') || 'null'),
        pageSection: pageSection || 'Hero carousel - Page d\'accueil',
        existingContent,
      }
    );

    res.json({ alt: altText });
  } catch (error: any) {
    console.error('Generate alt error:', error);
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
});

// Generate SEO for homepage
adminRoutes.post('/homepage/generate-seo', aiRateLimiter, async (req, res) => {
  try {
    // Get company and homepage settings for context
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'company.name',
            'company.activity',
            'company.location',
            'seo.globalKeywords',
            'homepage.config',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    let pageContent = '';
    let sectionTitle = '';
    try {
      const homepageConfig = JSON.parse(settingsMap.get('homepage.config') || '{}');
      if (homepageConfig.sections && Array.isArray(homepageConfig.sections)) {
        pageContent = homepageConfig.sections
          .map((s: any) => s.content || '')
          .join(' ')
          .substring(0, 1000);
      }
    } catch {
      // Ignore errors
    }

    let globalKeywords: string[] = [];
    try {
      globalKeywords = JSON.parse(settingsMap.get('seo.globalKeywords') || '[]');
    } catch {
      // Ignore errors
    }

    const seo = await mistralService.generateSEO(
      'homepage',
      {
        companyName: JSON.parse(settingsMap.get('company.name') || 'null'),
        companyActivity: JSON.parse(settingsMap.get('company.activity') || 'null'),
        companyLocation: JSON.parse(settingsMap.get('company.location') || 'null'),
        pageContent,
        globalKeywords,
      }
    );

    res.json({ seo });
  } catch (error: any) {
    console.error('Generate SEO error:', error);
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
});

// Upload homepage carousel image
adminRoutes.post('/upload/homepage-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    console.log('📤 Uploaded file:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload homepage image error:', error);
    res.status(500).json({ error: { message: error.message || 'Upload failed' } });
  }
});

