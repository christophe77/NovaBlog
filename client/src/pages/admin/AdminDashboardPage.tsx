import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import Loading from '../../components/Loading';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topicsConfigured, setTopicsConfigured] = useState<boolean | null>(null);
  const [lighthouseResults, setLighthouseResults] = useState<any>(null);
  const [lighthouseLoading, setLighthouseLoading] = useState(false);
  const [siteUrl, setSiteUrl] = useState('http://localhost:5173');

  useEffect(() => {
    api
      .getDashboardStats()
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check if topics are configured
    api
      .getSettings('blog')
      .then((data) => {
        const topics = data.settings?.blog?.topics || [];
        setTopicsConfigured(Array.isArray(topics) && topics.length > 0);
      })
      .catch(() => {
        setTopicsConfigured(null);
      });

    // Load cached Lighthouse results
    api
      .getLighthouseResults()
      .then((data) => {
        if (data.result) {
          setLighthouseResults(data.result);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const triggerGeneration = async () => {
    try {
      await api.apiRequest('/admin/scheduler/generate-now', {
        method: 'POST',
      });
      alert('Génération d\'article démarrée. Vérifiez la liste des articles dans quelques instants.');
    } catch (error) {
      console.error('Error triggering generation:', error);
    }
  };

  const runLighthouse = async () => {
    if (!siteUrl) {
      alert('Veuillez entrer une URL');
      return;
    }

    setLighthouseLoading(true);
    try {
      const data = await api.runLighthouseAudit(siteUrl);
      setLighthouseResults(data.result);
      alert('Audit Lighthouse terminé avec succès !');
    } catch (error: any) {
      alert('Erreur lors de l\'audit Lighthouse: ' + (error.message || 'Erreur inconnue'));
      console.error('Lighthouse error:', error);
    } finally {
      setLighthouseLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (loading) {
    return <Loading fullScreen message="Chargement du dashboard" />;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xl)' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-sm)' }}>Total Articles</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalArticles || 0}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-sm)' }}>Publiés</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{stats?.publishedArticles || 0}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-sm)' }}>Brouillons</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats?.draftArticles || 0}</p>
        </div>
      </div>

      {topicsConfigured === false && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: '#fef3c7', borderColor: '#f59e0b' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-sm)', color: '#92400e' }}>
            ⚠️ Configuration requise
          </h2>
          <p style={{ color: '#78350f', marginBottom: 'var(--spacing-md)' }}>
            Aucun sujet d'article n'est configuré. La génération automatique ne fonctionnera pas tant que vous n'aurez pas ajouté au moins un sujet.
          </p>
          <Link to="/admin/settings" className="btn btn-primary" style={{ background: '#f59e0b' }}>
            Configurer les sujets d'articles
          </Link>
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>Dernière génération IA</h2>
        {stats?.lastGeneration ? (
          <div>
            <p>
              <strong>Statut:</strong> {stats.lastGeneration.status}
            </p>
            {stats.lastGeneration.completedAt && (
              <p>
                <strong>Date:</strong>{' '}
                {new Date(stats.lastGeneration.completedAt).toLocaleString('fr-FR')}
              </p>
            )}
            {stats.lastGeneration.error && (
              <p style={{ color: '#dc2626' }}>
                <strong>Erreur:</strong> {stats.lastGeneration.error}
              </p>
            )}
          </div>
        ) : (
          <p>Aucune génération effectuée pour le moment.</p>
        )}
      </div>

      {/* Lighthouse Section */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>📊 Scores Lighthouse</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-md)' }}>
          Analysez les performances, l'accessibilité, les bonnes pratiques et le SEO de votre site.
        </p>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label" style={{ marginBottom: 'var(--spacing-xs)' }}>URL du site</label>
            <input
              type="text"
              className="form-input"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="http://localhost:5173"
            />
          </div>
          <button 
            onClick={runLighthouse} 
            className="btn btn-primary"
            disabled={lighthouseLoading}
          >
            {lighthouseLoading ? 'Analyse en cours...' : 'Lancer l\'audit'}
          </button>
        </div>

        {lighthouseResults && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-xs)' }}>Performance</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(lighthouseResults.performance) }}>
                  {lighthouseResults.performance}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-xs)' }}>Accessibilité</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(lighthouseResults.accessibility) }}>
                  {lighthouseResults.accessibility}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-xs)' }}>Bonnes pratiques</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(lighthouseResults.bestPractices) }}>
                  {lighthouseResults.bestPractices}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)', background: '#f9fafb', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-xs)' }}>SEO</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(lighthouseResults.seo) }}>
                  {lighthouseResults.seo}
                </div>
              </div>
            </div>
            {lighthouseResults.timestamp && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                Dernier audit: {new Date(lighthouseResults.timestamp).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <Link to="/admin/articles/new" className="btn btn-primary">
          Créer un article
        </Link>
        <button onClick={triggerGeneration} className="btn btn-secondary">
          Générer un article maintenant
        </button>
        <Link to="/admin/articles" className="btn btn-outline">
          Voir tous les articles
        </Link>
      </div>
    </div>
  );
}

