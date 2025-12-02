// Default settings for the platform
export const defaultSettings = {
  company: {
    name: 'NovaBlog',
    activity: 'Solutions IT innovantes en Bretagne',
    location: 'Bretagne, France',
    siren: '',
    address: '',
    email: '',
    phone: '',
    logo: '',
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#3b82f6',
  },
  seo: {
    siteTitle: 'NovaBlog - Micro-blogging avec IA',
    metaDescription: 'Plateforme de micro-blogging dédiée à l\'innovation technologique et à l\'intelligence artificielle en Bretagne',
    globalKeywords: ['innovation', 'bretagne', 'intelligence artificielle', 'IT', 'tech'],
  },
  blog: {
    topics: [
      'L\'intelligence artificielle en Bretagne',
      'Les dernières tendances IT',
      'Innovation technologique et développement durable',
      'L\'écosystème tech breton',
    ],
    keywords: ['IA', 'Tech', 'Innovation', 'Bretagne'],
  },
  ai: {
    model: 'mistral-large-latest',
    tone: 'technique mais accessible',
    length: 'medium',
    articlesPerInterval: 1,
    intervalDays: 3,
  },
  language: {
    default: 'fr',
  },
  analytics: {
    googleAnalyticsId: '',
  },
};

