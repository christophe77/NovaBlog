import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { emailService } from '../services/email.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';

export const publicRoutes = Router();

// Get published articles
publicRoutes.get('/articles', async (req, res) => {
  try {
    const { page = '1', limit = '10', language } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (language) {
      where.language = language;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          image: true,
          publishedAt: true,
          language: true,
          seoTitle: true,
          seoDescription: true,
        },
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
    console.error('Get public articles error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Get single article by slug
publicRoutes.get('/articles/:slug', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug: req.params.slug,
        status: 'PUBLISHED',
      },
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

// Get public settings (for theme, company info, etc.)
publicRoutes.get('/settings/public', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: {
          in: ['company', 'theme', 'seo', 'social'],
        },
      },
    });

    const publicSettings: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        publicSettings[setting.key] = JSON.parse(setting.value);
      } catch {
        publicSettings[setting.key] = setting.value;
      }
    });

    res.json({ settings: publicSettings });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Get homepage configuration
publicRoutes.get('/homepage/config', async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'homepage.config' },
    });

    if (!setting) {
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

// Send contact email
publicRoutes.post('/contact', aiRateLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: { message: 'Name, email, and message are required' } });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: { message: 'Invalid email address' } });
    }

    await emailService.sendContactEmail({
      name,
      email,
      subject,
      message,
    });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Send contact email error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to send message. Please check email configuration.',
      },
    });
  }
});

