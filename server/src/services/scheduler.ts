import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { mistralService } from './mistral.js';
import { generateSlug } from '../utils/slug.js';

let cronJob: cron.ScheduledTask | null = null;

async function generateScheduledArticle(): Promise<void> {
  console.log('🔄 Starting scheduled article generation...');

  try {
    // Get configuration
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'blog.topics',
            'blog.keywords',
            'seo.globalKeywords',
            'company.name',
            'company.activity',
            'company.location',
            'ai.model',
            'ai.tone',
            'ai.length',
            'ai.apiKey',
            'language.default',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const topics = JSON.parse(settingsMap.get('blog.topics') || '[]');
    const keywords = JSON.parse(settingsMap.get('blog.keywords') || '[]');
    const globalKeywords = JSON.parse(settingsMap.get('seo.globalKeywords') || '[]');
    const defaultLanguage = JSON.parse(settingsMap.get('language.default') || '"fr"');

    if (topics.length === 0) {
      console.log('⚠️  No topics configured, skipping article generation');
      return;
    }

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

    // Get last generated article to rotate topics
    const lastArticle = await prisma.article.findFirst({
      where: { source: 'AI_GENERATED' },
      orderBy: { createdAt: 'desc' },
    });

    let topicIndex = 0;
    if (lastArticle?.aiPrompt) {
      // Try to find which topic was used last
      const lastTopic = topics.findIndex((t: string) =>
        lastArticle.aiPrompt?.includes(t)
      );
      topicIndex = lastTopic >= 0 ? (lastTopic + 1) % topics.length : 0;
    }

    const selectedTopic = topics[topicIndex];
    const selectedKeywords = keywords.length > 0 
      ? [keywords[topicIndex % keywords.length]] 
      : [];

    // Generate article
    const articleData = await mistralService.generateArticle(
      {
        topic: selectedTopic,
        keywords: selectedKeywords,
        language: defaultLanguage,
        companyInfo: {
          name: JSON.parse(settingsMap.get('company.name') || 'null'),
          activity: JSON.parse(settingsMap.get('company.activity') || 'null'),
          location: JSON.parse(settingsMap.get('company.location') || 'null'),
        },
        seoConfig: {
          globalKeywords,
        },
        tone: JSON.parse(settingsMap.get('ai.tone') || '"technique mais accessible"'),
        length: (JSON.parse(settingsMap.get('ai.length') || '"medium"') as 'short' | 'medium' | 'long'),
      },
      apiKey
    );

    // Create article as DRAFT
    const slug = generateSlug(articleData.title);
    const existingSlug = await prisma.article.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    await prisma.article.create({
      data: {
        slug: finalSlug,
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        language: defaultLanguage,
        status: 'DRAFT',
        seoTitle: articleData.seoTitle,
        seoDescription: articleData.seoDescription,
        keywords: JSON.stringify(selectedKeywords),
        source: 'AI_GENERATED',
        aiPrompt: `Topic: ${selectedTopic}`,
        aiModel: process.env.MISTRAL_MODEL || 'mistral-large-latest',
      },
    });

    // Log task
    await prisma.scheduledTask.create({
      data: {
        type: 'article_generation',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    console.log('✅ Article generated successfully:', finalSlug);
  } catch (error) {
    console.error('❌ Error generating article:', error);

    // Log failed task
    await prisma.scheduledTask.create({
      data: {
        type: 'article_generation',
        status: 'FAILED',
        startedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

export function startScheduler(): void {
  if (cronJob) {
    console.log('Scheduler already running');
    return;
  }

  // Run every 3 days at 9 AM (Europe/Paris)
  // Cron format: minute hour day month weekday
  // "0 9 */3 * *" = every 3 days at 9 AM
  // Note: node-cron doesn't support "every N days" directly, so we use a workaround
  // For production, consider using a more robust scheduler or external cron service
  
  // Run every day and check if 3 days have passed since last generation
  cronJob = cron.schedule('0 9 * * *', async () => {
    const lastTask = await prisma.scheduledTask.findFirst({
      where: {
        type: 'article_generation',
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    if (!lastTask || !lastTask.completedAt || lastTask.completedAt < threeDaysAgo) {
      await generateScheduledArticle();
    } else {
      console.log('⏭️  Skipping: Last article generated less than 3 days ago');
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'Europe/Paris',
  });

  console.log('📅 Scheduler started: Will check for article generation daily at 9 AM');
}

export function stopScheduler(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Scheduler stopped');
  }
}

// Export function to manually trigger generation
export { generateScheduledArticle };

