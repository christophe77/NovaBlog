import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const MISTRAL_API_KEY_ENV = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';
const MISTRAL_BASE_URL = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai';

// Helper function to get API key from settings or environment
async function getMistralApiKey(): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'ai.apiKey' },
    });
    if (setting) {
      try {
        const apiKey = JSON.parse(setting.value);
        if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
          return apiKey.trim();
        }
      } catch {
        // If not JSON, use as string
        if (setting.value && setting.value.trim().length > 0) {
          return setting.value.trim();
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Mistral API key from settings:', error);
  }
  return MISTRAL_API_KEY_ENV || null;
}

interface GenerateArticleParams {
  topic: string;
  keywords?: string[];
  language: string;
  companyInfo?: {
    name?: string;
    activity?: string;
    location?: string;
  };
  theme?: string;
  seoConfig?: {
    globalKeywords?: string[];
  };
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class MistralService {
  private async callMistralAPI(
    messages: Array<{ role: string; content: string }>,
    apiKey?: string
  ): Promise<string> {
    const mistralApiKey = apiKey || await getMistralApiKey();
    if (!mistralApiKey) {
      throw new Error('MISTRAL_API_KEY is not configured. Please set it in the AI settings.');
    }

    const response = await fetch(`${MISTRAL_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${error}`);
    }

    const data: MistralResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async generateArticle(
    params: GenerateArticleParams,
    apiKey?: string
  ): Promise<{
    title: string;
    content: string;
    excerpt: string;
    seoTitle?: string;
    seoDescription?: string;
  }> {
    const {
      topic,
      keywords = [],
      language,
      companyInfo,
      theme = 'IT, Bretagne, IA',
      seoConfig,
      tone = 'technique mais accessible',
      length = 'medium',
    } = params;

    const lengthMap = {
      short: '500-800 mots',
      medium: '1000-1500 mots',
      long: '2000-2500 mots',
    };

    const companyContext = companyInfo
      ? `
Informations sur l'entreprise :
- Nom : ${companyInfo.name || 'Non spécifié'}
- Activité : ${companyInfo.activity || 'Non spécifiée'}
- Localisation : ${companyInfo.location || 'Non spécifiée'}
`
      : '';

    const keywordsList = [
      ...(keywords || []),
      ...(seoConfig?.globalKeywords || []),
    ].filter(Boolean);

    const prompt = `Tu es un expert en rédaction de contenu web spécialisé dans ${theme}.

${companyContext}

Tâche : Rédige un article de blog complet sur le sujet suivant : "${topic}"

Contraintes :
- Langue : ${language}
- Ton : ${tone}
- Longueur : ${lengthMap[length]}
- Intègre naturellement les mots-clés suivants : ${keywordsList.join(', ') || 'aucun'}
- Structure : Introduction, 3-4 sections principales avec sous-titres, conclusion
- Style : Professionnel, engageant, avec des exemples concrets

Format de réponse (JSON strict) :
{
  "title": "Titre de l'article",
  "content": "Contenu complet en markdown avec ## pour les titres de sections",
  "excerpt": "Résumé en 2-3 phrases",
  "seoTitle": "Titre SEO optimisé (max 60 caractères)",
  "seoDescription": "Description SEO (max 160 caractères)"
}`;

    const response = await this.callMistralAPI(
      [
        {
          role: 'system',
          content: `Tu es un assistant expert en rédaction de contenu web. Tu réponds toujours en JSON valide, sans texte supplémentaire.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      apiKey
    );

    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || topic,
        content: parsed.content || response,
        excerpt: parsed.excerpt || this.generateExcerpt(parsed.content || response),
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse Mistral response as JSON, using fallback');
      return {
        title: topic,
        content: response,
        excerpt: this.generateExcerpt(response),
      };
    }
  }

  async summarizeForExcerpt(content: string, apiKey?: string): Promise<string> {
    const prompt = `Résume ce contenu en 2-3 phrases courtes et engageantes :

${content.substring(0, 1000)}`;

    const response = await this.callMistralAPI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      apiKey
    );

    return response.trim();
  }

  async translateContent(content: string, targetLanguage: string, apiKey?: string): Promise<string> {
    const prompt = `Traduis ce contenu en ${targetLanguage}, en conservant le style et le ton :

${content}`;

    const response = await this.callMistralAPI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      apiKey
    );

    return response.trim();
  }

  private generateExcerpt(content: string, maxLength: number = 200): string {
    // Simple fallback excerpt generation
    const text = content.replace(/[#*\[\]]/g, '').trim();
    if (text.length <= maxLength) {
      return text;
    }
    const excerpt = text.substring(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(' ');
    return lastSpace > 0 ? excerpt.substring(0, lastSpace) + '...' : excerpt + '...';
  }

  /**
   * Generate alt text for an image using Mistral Small
   */
  async generateImageAlt(
    imageUrl: string,
    context?: {
      companyName?: string;
      companyActivity?: string;
      pageSection?: string;
      existingContent?: string;
    },
    apiKey?: string
  ): Promise<string> {
    const mistralApiKey = apiKey || await getMistralApiKey();
    if (!mistralApiKey) {
      throw new Error('MISTRAL_API_KEY is not configured. Please set it in the AI settings.');
    }

    const contextInfo = context
      ? `
Contexte de l'entreprise :
- Nom : ${context.companyName || 'Non spécifié'}
- Activité : ${context.companyActivity || 'Non spécifiée'}
- Section de la page : ${context.pageSection || 'Page d\'accueil'}
${context.existingContent ? `- Contenu existant de la page : ${context.existingContent.substring(0, 500)}` : ''}
`
      : '';

    const prompt = `Tu es un expert en accessibilité web et SEO.

${contextInfo}

Tâche : Génère un texte alternatif (alt) descriptif et optimisé SEO pour une image située à l'URL : ${imageUrl}

Contraintes :
- Maximum 125 caractères
- Décrit précisément le contenu et le contexte de l'image
- Inclut des mots-clés pertinents si approprié
- Accessible pour les lecteurs d'écran
- En français
- Pas de ponctuation finale

Réponds uniquement avec le texte alt, sans guillemets ni texte supplémentaire.`;

    const response = await fetch(`${MISTRAL_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${error}`);
    }

    const data: MistralResponse = await response.json();
    return (data.choices[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Generate SEO metadata (title and description) using Mistral Small
   */
  async generateSEO(
    pageType: 'homepage' | 'section',
    context: {
      companyName?: string;
      companyActivity?: string;
      companyLocation?: string;
      pageContent?: string;
      sectionTitle?: string;
      globalKeywords?: string[];
    },
    apiKey?: string
  ): Promise<{ title: string; description: string }> {
    const mistralApiKey = apiKey || await getMistralApiKey();
    if (!mistralApiKey) {
      throw new Error('MISTRAL_API_KEY is not configured. Please set it in the AI settings.');
    }

    const companyContext = `
Informations sur l'entreprise :
- Nom : ${context.companyName || 'Non spécifié'}
- Activité : ${context.companyActivity || 'Non spécifiée'}
- Localisation : ${context.companyLocation || 'Non spécifiée'}
`;

    const keywordsList = (context.globalKeywords || []).filter(Boolean).join(', ');
    const contentPreview = context.pageContent ? context.pageContent.substring(0, 1000) : '';

    const prompt = `Tu es un expert en SEO et référencement web.

${companyContext}

${keywordsList ? `Mots-clés à intégrer : ${keywordsList}` : ''}

${contentPreview ? `Contenu de la page :\n${contentPreview}` : ''}

Tâche : Génère des métadonnées SEO optimisées pour ${pageType === 'homepage' ? 'la page d\'accueil' : `la section "${context.sectionTitle || 'Non spécifiée'}"`}.

Format de réponse (JSON strict) :
{
  "title": "Titre SEO optimisé (max 60 caractères, inclut le nom de l'entreprise et mots-clés principaux)",
  "description": "Description SEO optimisée (max 160 caractères, accrocheur, inclut mots-clés naturellement)"
}

Contraintes :
- Titre : 50-60 caractères idéalement, inclut le nom de l'entreprise
- Description : 150-160 caractères, accrocheur et informatif
- Intègre naturellement les mots-clés fournis
- En français
- Optimisé pour le référencement local si localisation fournie`;

    const response = await fetch(`${MISTRAL_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant expert en SEO. Tu réponds toujours en JSON valide, sans texte supplémentaire.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${error}`);
    }

    const data: MistralResponse = await response.json();
    const responseText = data.choices[0]?.message?.content || '';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(jsonStr);

      return {
        title: parsed.title || '',
        description: parsed.description || '',
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse Mistral SEO response as JSON, using fallback');
      const lines = responseText.split('\n').filter((line) => line.trim());
      return {
        title: lines[0]?.substring(0, 60) || '',
        description: lines[1]?.substring(0, 160) || '',
      };
    }
  }
}

export const mistralService = new MistralService();

