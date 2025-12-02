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
            'ai.articlesPerInterval',
            'ai.intervalDays',
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
    const articlesPerInterval = parseInt(settingsMap.get('ai.articlesPerInterval') || '1', 10);
    const intervalDays = parseInt(settingsMap.get('ai.intervalDays') || '3', 10);

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

    // Get last generated articles to determine what to generate next
    const lastArticles = await prisma.article.findMany({
      where: { source: 'AI_GENERATED' },
      orderBy: { createdAt: 'desc' },
      take: articlesPerInterval,
    });

    // Determine starting topic index
    let topicIndex = 0;
    if (lastArticles.length > 0 && lastArticles[0]?.aiPrompt) {
      // Try to find which topic was used last
      const lastTopic = topics.findIndex((t: string) =>
        lastArticles[0].aiPrompt?.includes(t)
      );
      topicIndex = lastTopic >= 0 ? (lastTopic + 1) % topics.length : 0;
    }

    // Generate the configured number of articles
    const generatedArticles: string[] = [];
    
    for (let i = 0; i < articlesPerInterval; i++) {
      const currentTopicIndex = (topicIndex + i) % topics.length;
      const selectedTopic = topics[currentTopicIndex];
      const selectedKeywords = keywords.length > 0 
        ? [keywords[currentTopicIndex % keywords.length]] 
        : [];

      try {
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
        const finalSlug = existingSlug ? `${slug}-${Date.now()}-${i}` : slug;

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

        generatedArticles.push(finalSlug);
        console.log(`✅ Article ${i + 1}/${articlesPerInterval} generated successfully:`, finalSlug);
        
        // Small delay between articles to avoid rate limiting
        if (i < articlesPerInterval - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      } catch (error) {
        console.error(`❌ Error generating article ${i + 1}/${articlesPerInterval}:`, error);
        // Continue with next article even if one fails
      }
    }

    // Log task
    await prisma.scheduledTask.create({
      data: {
        type: 'article_generation',
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    console.log(`✅ Generated ${generatedArticles.length}/${articlesPerInterval} articles successfully`);
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

  // Run daily at 9 AM (Europe/Paris) and check if interval has passed since last generation
  // The interval is configurable via settings (ai.intervalDays)
  cronJob = cron.schedule('0 9 * * *', async () => {
    try {
      // Get current interval configuration
      const intervalSetting = await prisma.setting.findUnique({
        where: { key: 'ai.intervalDays' },
      });
      
      const intervalDays = intervalSetting 
        ? parseInt(intervalSetting.value, 10) || 3
        : 3;

      const lastTask = await prisma.scheduledTask.findFirst({
        where: {
          type: 'article_generation',
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
      });

      const intervalAgo = new Date();
      intervalAgo.setDate(intervalAgo.getDate() - intervalDays);

      if (!lastTask || !lastTask.completedAt || lastTask.completedAt < intervalAgo) {
        console.log(`📅 Interval of ${intervalDays} days has passed, generating articles...`);
        await generateScheduledArticle();
      } else {
        const daysSince = Math.floor(
          (new Date().getTime() - lastTask.completedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        console.log(`⏭️  Skipping: Last articles generated ${daysSince} day(s) ago (interval: ${intervalDays} days)`);
      }
    } catch (error) {
      console.error('❌ Error in scheduler check:', error);
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

