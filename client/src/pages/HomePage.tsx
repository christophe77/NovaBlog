import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface CarouselSlide {
  id: string;
  image: string;
  alt: string;
}

interface HomepageSection {
  id: string;
  title: string;
  content: string;
}

interface ContactBlock {
  enabled: boolean;
  title: string;
  description?: string;
  emailLabel: string;
  nameLabel: string;
  subjectLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
}

interface HomepageConfig {
  heroCarousel: {
    enabled: boolean;
    slides: CarouselSlide[];
  };
  sections: HomepageSection[];
  contact: ContactBlock;
  seo: {
    title: string;
    description: string;
  };
}

export default function HomePage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    Promise.all([
      api.getPublicSettings(),
      api.getHomepageConfig(),
      api.getArticles({ limit: 3 }),
    ])
      .then(([settingsRes, configRes, articlesRes]) => {
        setSettings(settingsRes.settings);
        setHomepageConfig(configRes.config);
        setArticles(articlesRes.articles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Update SEO meta tags
  useEffect(() => {
    if (homepageConfig?.seo) {
      const seoTitle = homepageConfig.seo.title || settings['seo.siteTitle'] || 'InnovLayer';
      document.title = seoTitle;
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute(
        'content',
        homepageConfig.seo.description || settings['seo.metaDescription'] || ''
      );
    }
  }, [homepageConfig, settings]);

  // Auto-rotate carousel
  useEffect(() => {
    if (
      homepageConfig?.heroCarousel?.enabled &&
      homepageConfig.heroCarousel.slides.length > 1
    ) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) =>
          prev === homepageConfig.heroCarousel.slides.length - 1 ? 0 : prev + 1
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [homepageConfig]);

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  const companyName = settings['company.name'] || 'InnovLayer';
  const companyActivity = settings['company.activity'] || 'Solutions IT innovantes en Bretagne';
  const companyLocation = settings['company.location'] || 'Bretagne, France';

  const config = homepageConfig || {
    heroCarousel: { enabled: false, slides: [] },
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
    seo: { title: '', description: '' },
  };

  // Render HTML content from WYSIWYG editor
  const renderHTML = (html: string) => {
    return <div className="ql-editor" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div>
      {/* Hero Carousel or Default Hero */}
      {config.heroCarousel.enabled && config.heroCarousel.slides.length > 0 ? (
        <HeroCarousel
          slides={config.heroCarousel.slides}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
        />
      ) : (
        <DefaultHero settings={settings} companyName={companyName} companyActivity={companyActivity} companyLocation={companyLocation} />
      )}

      {/* Custom Sections */}
      {config.sections.map((section, index) => (
        <section
          key={section.id}
          style={{
            padding: 'var(--spacing-2xl) 0',
            background: index % 2 === 1 ? '#f9fafb' : 'transparent',
          }}
        >
          <div className="container">
            {section.title && (
              <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)' }}>
                {section.title}
              </h2>
            )}
            {section.content && (
              <div
                style={{
                  fontSize: '1.125rem',
                  lineHeight: 'var(--line-height-relaxed)',
                  color: '#374151',
                }}
              >
                {renderHTML(section.content)}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Contact Block */}
      {config.contact.enabled && <ContactForm config={config.contact} />}

      {/* Latest Articles */}
      <LatestArticles articles={articles} />
    </div>
  );
}

function HeroCarousel({
  slides,
  currentSlide,
  setCurrentSlide,
}: {
  slides: CarouselSlide[];
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
}) {
  return (
    <section
      style={{
        position: 'relative',
        height: '500px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={slide.image}
            alt={slide.alt || `Slide ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1)}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            ›
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
            }}
          >
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: 'none',
                  background: index === currentSlide ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function DefaultHero({
  settings,
  companyName,
  companyActivity,
  companyLocation,
}: {
  settings: Record<string, any>;
  companyName: string;
  companyActivity: string;
  companyLocation: string;
}) {
  return (
    <section
      style={{
        padding: 'var(--spacing-2xl) 0',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        color: 'white',
      }}
    >
      <div className="container" style={{ textAlign: 'center' }}>
        {settings['company.logo'] && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <img
              src={settings['company.logo']}
              alt={companyName}
              style={{
                maxWidth: '200px',
                maxHeight: '100px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </div>
        )}
        <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>{companyName}</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)', opacity: 0.9 }}>
          {companyActivity}
        </p>
        <p style={{ opacity: 0.8 }}>📍 {companyLocation}</p>
      </div>
    </section>
  );
}

function ContactForm({ config }: { config: ContactBlock }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors de l\'envoi du message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div className="container">
        <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>{config.title}</h2>
        {config.description && (
          <p style={{ marginBottom: 'var(--spacing-lg)', color: '#6b7280' }}>
            {config.description}
          </p>
        )}

        {success ? (
          <div
            className="card"
            style={{
              padding: 'var(--spacing-lg)',
              background: '#d1fae5',
              borderColor: '#10b981',
              color: '#065f46',
            }}
          >
            {config.successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {error && (
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: '#fee2e2',
                  borderColor: '#ef4444',
                  color: '#991b1b',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{config.nameLabel} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{config.emailLabel} *</label>
              <input
                type="email"
                className="form-input"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{config.subjectLabel}</label>
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{config.messageLabel} *</label>
              <textarea
                className="form-input form-textarea"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Envoi...' : config.submitLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function LatestArticles({ articles }: { articles: any[] }) {
  return (
    <section style={{ padding: 'var(--spacing-2xl) 0', background: '#f9fafb' }}>
      <div className="container">
        <h2 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)' }}>Derniers articles</h2>
        {articles.length === 0 ? (
          <p>Aucun article publié pour le moment.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            {articles.map((article) => (
              <div key={article.id} className="card">
                {article.image && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <Link to={`/blog/${article.slug}`}>
                      <img
                        src={article.image}
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </Link>
                  </div>
                )}
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)' }}>
                  <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                </h3>
                {article.excerpt && (
                  <p style={{ color: '#6b7280', marginBottom: 'var(--spacing-sm)' }}>
                    {article.excerpt}
                  </p>
                )}
                {article.publishedAt && (
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {articles.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
            <Link to="/blog" className="btn btn-primary">
              Voir tous les articles
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

