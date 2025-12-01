import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topicsConfigured, setTopicsConfigured] = useState<boolean | null>(null);

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

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
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

