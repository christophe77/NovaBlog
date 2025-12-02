import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import RichTextEditor from '../../components/RichTextEditor';

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
  sectionsTitle?: string;
  sections: HomepageSection[];
  contact: ContactBlock;
  seo: {
    title: string;
    description: string;
  };
}

export default function AdminHomepagePage() {
  const [config, setConfig] = useState<HomepageConfig>({
    heroCarousel: {
      enabled: false,
      slides: [],
    },
    sectionsTitle: '',
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAlt, setGeneratingAlt] = useState<string | null>(null);
  const [generatingSEO, setGeneratingSEO] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.apiRequest<{ config: HomepageConfig }>('/admin/homepage/config');
      setConfig(data.config || {
        heroCarousel: {
          enabled: false,
          slides: [],
        },
        sectionsTitle: '',
        sections: [],
        seo: {
          title: '',
          description: '',
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading homepage config:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.apiRequest('/admin/homepage/config', {
        method: 'PUT',
        body: JSON.stringify({ config }),
      });
      alert('Configuration sauvegardée avec succès');
    } catch (error: any) {
      alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleCarouselToggle = (enabled: boolean) => {
    setConfig({
      ...config,
      heroCarousel: {
        ...config.heroCarousel,
        enabled,
      },
    });
  };

  const handleAddCarouselSlide = () => {
    setConfig({
      ...config,
      heroCarousel: {
        ...config.heroCarousel,
        slides: [
          ...config.heroCarousel.slides,
          {
            id: Date.now().toString(),
            image: '',
            alt: '',
          },
        ],
      },
    });
  };

  const handleRemoveCarouselSlide = (slideId: string) => {
    setConfig({
      ...config,
      heroCarousel: {
        ...config.heroCarousel,
        slides: config.heroCarousel.slides.filter((s) => s.id !== slideId),
      },
    });
  };

  const handleCarouselSlideChange = (slideId: string, field: 'image' | 'alt', value: string) => {
    setConfig({
      ...config,
      heroCarousel: {
        ...config.heroCarousel,
        slides: config.heroCarousel.slides.map((s) =>
          s.id === slideId ? { ...s, [field]: value } : s
        ),
      },
    });
  };

  const handleCarouselImageUpload = async (slideId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload/homepage-image?type=homepage-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      if (data.url) {
        handleCarouselSlideChange(slideId, 'image', data.url);
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Erreur lors de l\'upload: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleGenerateAlt = async (slideId: string, imageUrl: string) => {
    setGeneratingAlt(slideId);
    try {
      const data = await api.apiRequest<{ alt: string }>('/admin/homepage/generate-alt', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          pageSection: 'Hero carousel - Page d\'accueil',
        }),
      });
      handleCarouselSlideChange(slideId, 'alt', data.alt);
    } catch (error: any) {
      alert('Erreur lors de la génération: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setGeneratingAlt(null);
    }
  };

  const handleAddSection = () => {
    setConfig({
      ...config,
      sections: [
        ...config.sections,
        {
          id: Date.now().toString(),
          title: '',
          content: '',
        },
      ],
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    setConfig({
      ...config,
      sections: config.sections.filter((s) => s.id !== sectionId),
    });
  };

  const handleSectionChange = (sectionId: string, field: 'title' | 'content', value: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, [field]: value } : s
      ),
    });
  };

  const handleGenerateSEO = async () => {
    setGeneratingSEO(true);
    try {
      const data = await api.apiRequest<{ seo: { title: string; description: string } }>(
        '/admin/homepage/generate-seo',
        {
          method: 'POST',
        }
      );
      setConfig({
        ...config,
        seo: data.seo,
      });
    } catch (error: any) {
      alert('Erreur lors de la génération: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setGeneratingSEO(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)' }}>
        Configuration de la page d'accueil
      </h1>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Hero Carousel</h2>

        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={config.heroCarousel.enabled}
              onChange={(e) => handleCarouselToggle(e.target.checked)}
            />
            <span>Activer le carousel hero</span>
          </label>
        </div>

        {config.heroCarousel.enabled && (
          <div>
            {config.heroCarousel.slides.map((slide) => (
              <div
                key={slide.id}
                className="card"
                style={{
                  marginBottom: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  background: '#f9fafb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <h3 style={{ fontSize: '1.125rem' }}>Slide {config.heroCarousel.slides.indexOf(slide) + 1}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveCarouselSlide(slide.id)}
                    className="btn btn-outline"
                    style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                  >
                    Supprimer
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Image</label>
                  {slide.image && (
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <img
                        src={slide.image}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleCarouselImageUpload(slide.id, file);
                        }
                        e.target.value = '';
                      }}
                      style={{ flex: 1 }}
                      disabled={saving}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>ou</span>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="URL de l'image"
                      value={slide.image && !slide.image.startsWith('/uploads/') ? slide.image : ''}
                      onChange={(e) => handleCarouselSlideChange(slide.id, 'image', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Texte alternatif (alt)</label>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Description de l'image pour l'accessibilité et le SEO"
                      value={slide.alt}
                      onChange={(e) => handleCarouselSlideChange(slide.id, 'alt', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {slide.image && (
                      <button
                        type="button"
                        onClick={() => handleGenerateAlt(slide.id, slide.image)}
                        className="btn btn-outline"
                        disabled={generatingAlt === slide.id}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {generatingAlt === slide.id ? 'Génération...' : '✨ Générer avec IA'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                    Le texte alt est important pour l'accessibilité et le SEO. Utilisez l'IA pour générer un texte optimisé.
                  </p>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddCarouselSlide}
              className="btn btn-outline"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              + Ajouter un slide
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Sections de contenu</h2>

        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label className="form-label">Titre de la zone de sections</label>
          <input
            type="text"
            className="form-input"
            placeholder="Titre affiché avant les sections (optionnel)"
            value={config.sectionsTitle || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                sectionsTitle: e.target.value,
              })
            }
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
            Ce titre sera affiché avant la liste des sections sur la page d'accueil.
          </p>
        </div>

        {config.sections.map((section) => (
          <div
            key={section.id}
            className="card"
            style={{
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              background: '#f9fafb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: '1.125rem' }}>
                Section {config.sections.indexOf(section) + 1}
              </h3>
              <button
                type="button"
                onClick={() => handleRemoveSection(section.id)}
                className="btn btn-outline"
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Supprimer
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Titre</label>
              <input
                type="text"
                className="form-input"
                placeholder="Titre de la section"
                value={section.title}
                onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contenu</label>
              <RichTextEditor
                value={section.content}
                onChange={(value) => handleSectionChange(section.id, 'content', value)}
                placeholder="Rédigez le contenu de la section..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddSection}
          className="btn btn-outline"
          style={{ marginTop: 'var(--spacing-sm)' }}
        >
          + Ajouter une section
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Bloc Contact</h2>

        <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={config.contact.enabled}
              onChange={(e) =>
                setConfig({
                  ...config,
                  contact: { ...config.contact, enabled: e.target.checked },
                })
              }
            />
            <span>Activer le bloc contact</span>
          </label>
        </div>

        {config.contact.enabled && (
          <>
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contactez-nous"
                value={config.contact.title}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contact: { ...config.contact, title: e.target.value },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optionnel)</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Une description pour le bloc contact"
                value={config.contact.description || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contact: { ...config.contact, description: e.target.value },
                  })
                }
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">Label Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.nameLabel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, nameLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Label Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.emailLabel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, emailLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Label Sujet</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.subjectLabel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, subjectLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Label Message</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.messageLabel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, messageLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Label Bouton</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.submitLabel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, submitLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message de succès</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.contact.successMessage}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contact: { ...config.contact, successMessage: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>SEO</h2>

        <div className="form-group">
          <label className="form-label">Titre SEO</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Titre optimisé pour le référencement (max 60 caractères)"
              value={config.seo.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seo: { ...config.seo, title: e.target.value },
                })
              }
              maxLength={60}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleGenerateSEO}
              className="btn btn-outline"
              disabled={generatingSEO}
              style={{ whiteSpace: 'nowrap' }}
            >
              {generatingSEO ? 'Génération...' : '✨ Générer avec IA'}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
            {config.seo.title.length}/60 caractères
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Description SEO</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start' }}>
            <textarea
              className="form-input form-textarea"
              placeholder="Description optimisée pour le référencement (max 160 caractères)"
              value={config.seo.description}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seo: { ...config.seo, description: e.target.value },
                })
              }
              maxLength={160}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleGenerateSEO}
              className="btn btn-outline"
              disabled={generatingSEO}
              style={{ whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
            >
              {generatingSEO ? 'Génération...' : '✨ Générer avec IA'}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
            {config.seo.description.length}/160 caractères
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

