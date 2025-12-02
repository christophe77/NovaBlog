import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { URL } from 'url';

interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  timestamp: Date;
}

let cachedResult: LighthouseResult | null = null;
let lastAuditTime: Date | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

export async function runLighthouseAudit(siteUrl: string): Promise<LighthouseResult> {
  // Vérifier le cache
  if (cachedResult && lastAuditTime) {
    const timeSinceLastAudit = Date.now() - lastAuditTime.getTime();
    if (timeSinceLastAudit < CACHE_DURATION_MS) {
      console.log('📊 Using cached Lighthouse results');
      return cachedResult;
    }
  }

  console.log('🔍 Running Lighthouse audit for:', siteUrl);

  let chrome: chromeLauncher.LaunchedChrome | null = null;

  try {
    // Lancer Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });

    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    // Exécuter l'audit
    const runnerResult = await lighthouse(siteUrl, options);

    if (!runnerResult) {
      throw new Error('Lighthouse audit returned no results');
    }

    const lhr = runnerResult.lhr;

    const result: LighthouseResult = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100),
      timestamp: new Date(),
    };

    // Mettre en cache
    cachedResult = result;
    lastAuditTime = new Date();

    console.log('✅ Lighthouse audit completed:', result);

    return result;
  } catch (error) {
    console.error('❌ Lighthouse audit error:', error);
    throw error;
  } finally {
    // Fermer Chrome
    if (chrome) {
      await chrome.kill();
    }
  }
}

export function getCachedResult(): LighthouseResult | null {
  return cachedResult;
}

export function clearCache(): void {
  cachedResult = null;
  lastAuditTime = null;
}

