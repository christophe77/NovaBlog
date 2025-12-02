import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';

export default function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    language: 'fr',
    company: {
      name: '',
      siren: '',
      address: '',
      email: '',
      phone: '',
      logo: '',
      activity: '',
      location: 'Bretagne, France',
    },
    seo: {
      globalKeywords: [] as string[],
      metaDescription: '',
      siteTitle: '',
    },
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
    },
    ai: {
      model: 'mistral-large-latest',
      tone: 'technique mais accessible',
      length: 'medium' as 'short' | 'medium' | 'long',
    },
    admin: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    api
      .getSetupStatus()
      .then((data) => {
        if (data.setupComplete) {
          navigate('/admin/login');
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async () => {
    if (formData.admin.password !== formData.admin.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.admin.password.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSubmitting(true);
    try {
      await api.completeSetup({
        language: formData.language,
        company: formData.company,
        seo: {
          ...formData.seo,
          globalKeywords: formData.seo.globalKeywords.filter(Boolean),
        },
        theme: formData.theme,
        ai: formData.ai,
        admin: {
          email: formData.admin.email,
          password: formData.admin.password,
        },
      });
      alert('Configuration terminée avec succès !');
      navigate('/admin/login');
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Vérification de la configuration" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 'var(--spacing-2xl) 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
          <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
            Configuration initiale
          </h1>

          {/* Progress */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: step >= s ? 'var(--color-primary)' : '#e5e7eb',
                    color: step >= s ? 'white' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Language */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Langue par défaut</h2>
              <div className="form-group">
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
            </div>
          )}

          {/* Step 2-3: Company */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Informations entreprise</h2>
              <div className="form-group">
                <label className="form-label">Nom *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, name: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Activité</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company.activity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, activity: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Localisation</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company.location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, location: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Informations complémentaires</h2>
              <div className="form-group">
                <label className="form-label">SIREN</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company.siren}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, siren: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.company.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.company.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company: { ...formData.company, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 4: SEO */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>SEO</h2>
              <div className="form-group">
                <label className="form-label">Titre du site</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.seo.siteTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, siteTitle: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meta description</label>
                <textarea
                  className="form-input form-textarea"
                  value={formData.seo.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seo: { ...formData.seo, metaDescription: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 5: Theme */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Thème</h2>
              <div className="form-group">
                <label className="form-label">Couleur primaire</label>
                <input
                  type="color"
                  className="form-input"
                  value={formData.theme.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, primaryColor: e.target.value },
                    })
                  }
                  style={{ width: '100px', height: '40px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Couleur secondaire</label>
                <input
                  type="color"
                  className="form-input"
                  value={formData.theme.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, secondaryColor: e.target.value },
                    })
                  }
                  style={{ width: '100px', height: '40px' }}
                />
              </div>
            </div>
          )}

          {/* Step 6: AI */}
          {step === 6 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Paramètres IA</h2>
              <div className="form-group">
                <label className="form-label">Modèle Mistral</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.ai.model}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ai: { ...formData.ai, model: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ton des articles</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.ai.tone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ai: { ...formData.ai, tone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longueur</label>
                <select
                  className="form-input"
                  value={formData.ai.length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ai: { ...formData.ai, length: e.target.value as any },
                    })
                  }
                >
                  <option value="short">Court</option>
                  <option value="medium">Moyen</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 7: Admin */}
          {step === 7 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Compte administrateur</h2>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.admin.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, email: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe * (min 8 caractères)</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.admin.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, password: e.target.value },
                    })
                  }
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.admin.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admin: { ...formData.admin, confirmPassword: e.target.value },
                    })
                  }
                  required
                  minLength={8}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="btn btn-outline"
            >
              Précédent
            </button>
            {step < 7 ? (
              <button
                onClick={() => {
                  if (step === 2 && !formData.company.name) {
                    alert('Le nom de l\'entreprise est requis');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="btn btn-primary"
              >
                Suivant
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Configuration...' : 'Terminer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

