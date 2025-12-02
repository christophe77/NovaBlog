import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import RichTextEditor from '../../components/RichTextEditor';
import Loading from '../../components/Loading';

export default function AdminArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    language: 'fr',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
    seoTitle: '',
    seoDescription: '',
    keywords: [] as string[],
    keywordInput: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      api
        .getAdminArticle(id)
        .then((data) => {
          const article = data.article;
          setFormData({
            title: article.title || '',
            content: article.content || '',
            excerpt: article.excerpt || '',
            image: article.image || '',
            language: article.language || 'fr',
            status: article.status || 'DRAFT',
            seoTitle: article.seoTitle || '',
            seoDescription: article.seoDescription || '',
            keywords: article.keywords ? JSON.parse(article.keywords) : [],
            keywordInput: '',
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      alert('Veuillez d\'abord saisir un sujet/titre');
      return;
    }

    setGenerating(true);
    try {
      const result = await api.generateArticle({
        topic: formData.title,
        keywords: formData.keywords,
        language: formData.language,
      });
      setFormData({
        ...formData,
        title: result.article.title || formData.title,
        content: result.article.content || formData.content,
        excerpt: result.article.excerpt || formData.excerpt,
        seoTitle: result.article.seoTitle || formData.seoTitle,
        seoDescription: result.article.seoDescription || formData.seoDescription,
      });
    } catch (error: any) {
      alert('Erreur lors de la génération: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        image: formData.image || undefined,
        language: formData.language,
        status: formData.status,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        keywords: formData.keywords,
      };

      if (isNew) {
        const result = await api.createArticle(data);
        navigate(`/admin/articles/${result.article.id}/edit`);
      } else {
        await api.updateArticle(id!, data);
        alert('Article sauvegardé avec succès');
      }
    } catch (error: any) {
      alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (formData.keywordInput.trim() && !formData.keywords.includes(formData.keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, formData.keywordInput.trim()],
        keywordInput: '',
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  if (loading) {
    return <Loading fullScreen message="Chargement de l'article" />;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)' }}>
        {isNew ? 'Nouvel article' : 'Éditer l\'article'}
      </h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button onClick={handleGenerate} className="btn btn-secondary" disabled={generating}>
          {generating ? 'Génération...' : 'Générer avec IA'}
        </button>
        {!isNew && (
          <button
            onClick={async () => {
              try {
                await api.regenerateArticle(id!);
                window.location.reload();
              } catch (error) {
                alert('Erreur lors de la régénération');
              }
            }}
            className="btn btn-outline"
          >
            Régénérer avec IA
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="form-group">
          <label className="form-label">Titre *</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titre de l'article"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Langue</label>
          <select
            className="form-input"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Statut</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="SCHEDULED">Planifié</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Illustration</label>
          {formData.image && (
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <img
                src={formData.image}
                alt="Illustration actuelle"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-xs)',
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    setUploadingImage(true);
                    const result = await api.uploadArticleImage(file);
                    setFormData({ ...formData, image: result.url });
                    alert('Image uploadée avec succès');
                  } catch (error: any) {
                    alert('Erreur lors de l\'upload: ' + (error.message || 'Erreur inconnue'));
                  } finally {
                    setUploadingImage(false);
                    e.target.value = '';
                  }
                }
              }}
              style={{ flex: 1 }}
              disabled={uploadingImage}
            />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>ou</span>
            <input
              type="url"
              className="form-input"
              placeholder="URL de l'illustration"
              value={formData.image && !formData.image.startsWith('/uploads/') ? formData.image : ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              style={{ flex: 1 }}
            />
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
            Taille max: 5MB. Formats acceptés: JPG, PNG, GIF, WebP
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Extrait</label>
          <textarea
            className="form-input form-textarea"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Résumé court de l'article"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contenu *</label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
            placeholder="Rédigez votre article..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mots-clés</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <input
              type="text"
              className="form-input"
              value={formData.keywordInput}
              onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Ajouter un mot-clé"
            />
            <button type="button" onClick={addKeyword} className="btn btn-outline">
              Ajouter
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            {formData.keywords.map((keyword) => (
              <span
                key={keyword}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: '#e5e7eb',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  style={{
                    marginLeft: 'var(--spacing-xs)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Titre SEO (optionnel)</label>
          <input
            type="text"
            className="form-input"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            placeholder="Titre optimisé pour le SEO (max 60 caractères)"
            maxLength={60}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description SEO (optionnel)</label>
          <textarea
            className="form-input form-textarea"
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            placeholder="Description optimisée pour le SEO (max 160 caractères)"
            maxLength={160}
          />
        </div>
      </div>
    </div>
  );
}

