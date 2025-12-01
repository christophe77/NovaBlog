import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { applyThemeTokens } from '../../utils/theme';

type SettingsCategory = 'company' | 'theme' | 'seo' | 'blog' | 'ai' | 'language' | 'social' | 'email';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsCategory>('company');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const categorySettings = settings[activeTab] || {};
      // Convert category settings to flat key-value pairs
      const flatSettings: Record<string, any> = {};
      Object.keys(categorySettings).forEach((key) => {
        let value = categorySettings[key];
        // Filter empty strings for array fields (topics, keywords, globalKeywords)
        if (key === 'topics' || key === 'keywords' || key === 'globalKeywords') {
          if (Array.isArray(value)) {
            // Filter empty strings from array
            value = value.filter((item: string) => item && item.trim().length > 0);
          } else if (typeof value === 'string' && value.trim()) {
            // If it's a non-empty string, convert to array
            value = [value];
          } else {
            // Empty string or null, set to empty array
            value = [];
          }
        }
        flatSettings[`${activeTab}.${key}`] = value;
      });
      await api.updateSettings(flatSettings);
      
      // If theme settings were updated, apply them immediately
      if (activeTab === 'theme') {
        const publicSettings = await api.getPublicSettings();
        if (publicSettings.settings) {
          applyThemeTokens(publicSettings.settings);
        }
      }
      
      alert('Paramètres sauvegardés avec succès');
    } catch (error: any) {
      alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    const categorySettings = settings[activeTab] || {};
    setSettings({
      ...settings,
      [activeTab]: {
        ...categorySettings,
        [key]: value,
      },
    });
  };

  const getSetting = (key: string, defaultValue: any = '') => {
    const categorySettings = settings[activeTab] || {};
    return categorySettings[key] ?? defaultValue;
  };

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)' }}>Paramètres</h1>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {(['company', 'theme', 'seo', 'blog', 'ai', 'language', 'social', 'email'] as SettingsCategory[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
            }}
          >
            {tab === 'company' && 'Entreprise'}
            {tab === 'theme' && 'Thème'}
            {tab === 'seo' && 'SEO'}
            {tab === 'blog' && 'Blog'}
            {tab === 'ai' && 'IA'}
            {tab === 'language' && 'Langue'}
            {tab === 'social' && 'Réseaux sociaux'}
            {tab === 'email' && 'Email'}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'company' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Informations entreprise</h2>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('name')}
                onChange={(e) => updateSetting('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SIREN</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('siren')}
                onChange={(e) => updateSetting('siren', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <textarea
                className="form-input form-textarea"
                value={getSetting('address')}
                onChange={(e) => updateSetting('address', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={getSetting('email')}
                onChange={(e) => updateSetting('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('phone')}
                onChange={(e) => updateSetting('phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Logo</label>
              {getSetting('logo') && (
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <img
                    src={getSetting('logo')}
                    alt="Logo actuel"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '100px',
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
                        setSaving(true);
                        const result = await api.uploadLogo(file);
                        updateSetting('logo', result.url);
                        alert('Logo uploadé avec succès');
                      } catch (error: any) {
                        alert('Erreur lors de l\'upload: ' + (error.message || 'Erreur inconnue'));
                      } finally {
                        setSaving(false);
                        // Reset input
                        e.target.value = '';
                      }
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={saving}
                />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>ou</span>
                <input
                  type="url"
                  className="form-input"
                  placeholder="URL du logo"
                  value={getSetting('logo', '').startsWith('/uploads/') ? '' : getSetting('logo', '')}
                  onChange={(e) => updateSetting('logo', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                Taille max: 5MB. Formats acceptés: JPG, PNG, GIF, WebP
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Activité</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('activity')}
                onChange={(e) => updateSetting('activity', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Localisation</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('location')}
                onChange={(e) => updateSetting('location', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Réseaux sociaux</h2>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: '#6b7280' }}>
              Ajoutez les liens vers vos réseaux sociaux. Ils seront affichés dans le footer du site.
            </p>
            <div className="form-group">
              <label className="form-label">Facebook</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://facebook.com/votre-page"
                value={getSetting('facebook', '')}
                onChange={(e) => updateSetting('facebook', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://instagram.com/votre-compte"
                value={getSetting('instagram', '')}
                onChange={(e) => updateSetting('instagram', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">TikTok</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://tiktok.com/@votre-compte"
                value={getSetting('tiktok', '')}
                onChange={(e) => updateSetting('tiktok', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/company/votre-entreprise"
                value={getSetting('linkedin', '')}
                onChange={(e) => updateSetting('linkedin', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">X (Twitter)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://x.com/votre-compte"
                value={getSetting('twitter', '')}
                onChange={(e) => updateSetting('twitter', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reddit</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://reddit.com/user/votre-compte"
                value={getSetting('reddit', '')}
                onChange={(e) => updateSetting('reddit', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Design Tokens</h2>
            <div className="form-group">
              <label className="form-label">Couleur primaire</label>
              <input
                type="color"
                className="form-input"
                value={getSetting('primaryColor', '#2563eb')}
                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                style={{ width: '100px', height: '40px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur secondaire</label>
              <input
                type="color"
                className="form-input"
                value={getSetting('secondaryColor', '#10b981')}
                onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                style={{ width: '100px', height: '40px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur de fond</label>
              <input
                type="color"
                className="form-input"
                value={getSetting('backgroundColor', '#ffffff')}
                onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                style={{ width: '100px', height: '40px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur du texte</label>
              <input
                type="color"
                className="form-input"
                value={getSetting('textColor', '#1f2937')}
                onChange={(e) => updateSetting('textColor', e.target.value)}
                style={{ width: '100px', height: '40px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur d'accent</label>
              <input
                type="color"
                className="form-input"
                value={getSetting('accentColor', '#3b82f6')}
                onChange={(e) => updateSetting('accentColor', e.target.value)}
                style={{ width: '100px', height: '40px' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>SEO Global</h2>
            <div className="form-group">
              <label className="form-label">Titre du site</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('siteTitle')}
                onChange={(e) => updateSetting('siteTitle', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Meta description</label>
              <textarea
                className="form-input form-textarea"
                value={getSetting('metaDescription')}
                onChange={(e) => updateSetting('metaDescription', e.target.value)}
                maxLength={160}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mots-clés globaux</label>
              {(() => {
                const keywords = getSetting('globalKeywords');
                const keywordsArray = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
                return (
                  <>
                    {keywordsArray.map((keyword: string, index: number) => (
                      <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={keyword}
                          onChange={(e) => {
                            const newKeywords = [...keywordsArray];
                            newKeywords[index] = e.target.value;
                            updateSetting('globalKeywords', newKeywords);
                          }}
                          placeholder="Ex: innovation"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = keywordsArray.filter((_: string, i: number) => i !== index);
                            updateSetting('globalKeywords', newKeywords.length > 0 ? newKeywords : []);
                          }}
                          className="btn btn-outline"
                          style={{ padding: 'var(--spacing-sm) var(--spacing-md)', minWidth: 'auto' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const keywords = getSetting('globalKeywords');
                        const keywordsArray = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
                        updateSetting('globalKeywords', [...keywordsArray, '']);
                      }}
                      className="btn btn-outline"
                      style={{ marginTop: 'var(--spacing-sm)' }}
                    >
                      + Ajouter un mot-clé
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Configuration Blog</h2>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: '#6b7280', padding: 'var(--spacing-md)', background: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
              <strong>💡 Important :</strong> Ajoutez au moins un sujet d'article pour que la génération automatique fonctionne. 
              Le scheduler générera un article tous les 3 jours en utilisant ces sujets en rotation.
            </p>
            <div className="form-group">
              <label className="form-label">Sujets d'articles *</label>
              {(() => {
                const topics = getSetting('topics');
                const topicsArray = Array.isArray(topics) ? topics : (topics ? [topics] : []);
                return (
                  <>
                    {topicsArray.map((topic: string, index: number) => (
                      <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={topic}
                          onChange={(e) => {
                            const newTopics = [...topicsArray];
                            newTopics[index] = e.target.value;
                            updateSetting('topics', newTopics);
                          }}
                          placeholder="Ex: L'intelligence artificielle en Bretagne"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newTopics = topicsArray.filter((_: string, i: number) => i !== index);
                            updateSetting('topics', newTopics.length > 0 ? newTopics : []);
                          }}
                          className="btn btn-outline"
                          style={{ padding: 'var(--spacing-sm) var(--spacing-md)', minWidth: 'auto' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const topics = getSetting('topics');
                        const topicsArray = Array.isArray(topics) ? topics : (topics ? [topics] : []);
                        updateSetting('topics', [...topicsArray, '']);
                      }}
                      className="btn btn-outline"
                      style={{ marginTop: 'var(--spacing-sm)' }}
                    >
                      + Ajouter un sujet
                    </button>
                  </>
                );
              })()}
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                Chaque ligne représente un sujet d'article. Le scheduler utilisera ces sujets en rotation.
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Mots-clés pour articles</label>
              {(() => {
                const keywords = getSetting('keywords');
                const keywordsArray = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
                return (
                  <>
                    {keywordsArray.map((keyword: string, index: number) => (
                      <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={keyword}
                          onChange={(e) => {
                            const newKeywords = [...keywordsArray];
                            newKeywords[index] = e.target.value;
                            updateSetting('keywords', newKeywords);
                          }}
                          placeholder="Ex: IA"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = keywordsArray.filter((_: string, i: number) => i !== index);
                            updateSetting('keywords', newKeywords.length > 0 ? newKeywords : []);
                          }}
                          className="btn btn-outline"
                          style={{ padding: 'var(--spacing-sm) var(--spacing-md)', minWidth: 'auto' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const keywords = getSetting('keywords');
                        const keywordsArray = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
                        updateSetting('keywords', [...keywordsArray, '']);
                      }}
                      className="btn btn-outline"
                      style={{ marginTop: 'var(--spacing-sm)' }}
                    >
                      + Ajouter un mot-clé
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Paramètres IA (Mistral)</h2>
            <div className="form-group">
              <label className="form-label">Clé API Mistral *</label>
              <input
                type="password"
                className="form-input"
                value={getSetting('apiKey', '')}
                onChange={(e) => updateSetting('apiKey', e.target.value)}
                placeholder="Votre clé API Mistral"
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                Vous n'avez pas de clé API ?{' '}
                <a
                  href="https://console.mistral.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                >
                  Créer un compte développeur Mistral
                </a>
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Modèle</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('model', 'mistral-large-latest')}
                onChange={(e) => updateSetting('model', e.target.value)}
                placeholder="mistral-large-latest"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ton des articles</label>
              <input
                type="text"
                className="form-input"
                value={getSetting('tone', 'technique mais accessible')}
                onChange={(e) => updateSetting('tone', e.target.value)}
                placeholder="technique mais accessible"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longueur des articles</label>
              <select
                className="form-input"
                value={getSetting('length', 'medium')}
                onChange={(e) => updateSetting('length', e.target.value)}
              >
                <option value="short">Court (500-800 mots)</option>
                <option value="medium">Moyen (1000-1500 mots)</option>
                <option value="long">Long (2000-2500 mots)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Langues</h2>
            <div className="form-group">
              <label className="form-label">Langue par défaut</label>
              <select
                className="form-input"
                value={getSetting('default', 'fr')}
                onChange={(e) => updateSetting('default', e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>Configuration Email</h2>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: '#6b7280', padding: 'var(--spacing-md)', background: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
              <strong>💡 Important :</strong> Configurez les paramètres SMTP pour permettre l'envoi d'emails depuis le formulaire de contact.
              Pour Gmail, utilisez un "Mot de passe d'application" au lieu de votre mot de passe habituel.
            </p>
            <div className="form-group">
              <label className="form-label">Serveur SMTP (host)</label>
              <input
                type="text"
                className="form-input"
                placeholder="smtp.gmail.com"
                value={getSetting('host', '')}
                onChange={(e) => updateSetting('host', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input
                type="number"
                className="form-input"
                placeholder="587"
                value={getSetting('port', '587')}
                onChange={(e) => updateSetting('port', parseInt(e.target.value) || 587)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Connexion sécurisée (TLS/SSL)</label>
              <select
                className="form-input"
                value={getSetting('secure', false) ? 'true' : 'false'}
                onChange={(e) => updateSetting('secure', e.target.value === 'true')}
              >
                <option value="false">Non (port 587 avec STARTTLS)</option>
                <option value="true">Oui (port 465 avec SSL)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Utilisateur (email)</label>
              <input
                type="email"
                className="form-input"
                placeholder="votre-email@gmail.com"
                value={getSetting('user', '')}
                onChange={(e) => updateSetting('user', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mot de passe ou mot de passe d'application"
                value={getSetting('password', '')}
                onChange={(e) => updateSetting('password', e.target.value)}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                Pour Gmail, créez un <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>mot de passe d'application</a>
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Email expéditeur (from)</label>
              <input
                type="email"
                className="form-input"
                placeholder="noreply@votredomaine.com"
                value={getSetting('from', '')}
                onChange={(e) => updateSetting('from', e.target.value)}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 'var(--spacing-xs)' }}>
                L'adresse email qui apparaîtra comme expéditeur. Par défaut, utilise l'utilisateur ci-dessus.
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

