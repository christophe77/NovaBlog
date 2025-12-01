import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getAdminArticles({ status: statusFilter !== 'all' ? statusFilter : undefined, page, limit: 20 })
      .then((data) => {
        setArticles(data.articles);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      await api.deleteArticle(id);
      setArticles(articles.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishArticle(id);
      setArticles(articles.map((a) => (a.id === id ? { ...a, status: 'PUBLISHED', publishedAt: new Date().toISOString() } : a)));
    } catch (error) {
      console.error('Publish error:', error);
      alert('Erreur lors de la publication');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '2rem' }}>Articles</h1>
        <Link to="/admin/articles/new" className="btn btn-primary">
          Nouvel article
        </Link>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="form-input"
          style={{ width: 'auto' }}
        >
          <option value="all">Tous</option>
          <option value="DRAFT">Brouillons</option>
          <option value="PUBLISHED">Publiés</option>
          <option value="SCHEDULED">Planifiés</option>
        </select>
      </div>

      {articles.length === 0 ? (
        <p>Aucun article trouvé.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {articles.map((article) => (
              <div key={article.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-xs)' }}>
                    <Link to={`/admin/articles/${article.id}/edit`}>{article.title}</Link>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 'var(--spacing-sm)' }}>
                    {article.excerpt || 'Aucun extrait'}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.875rem', color: '#9ca3af' }}>
                    <span>Statut: {article.status}</span>
                    {article.publishedAt && (
                      <span>Publié: {new Date(article.publishedAt).toLocaleDateString('fr-FR')}</span>
                    )}
                    <span>Langue: {article.language}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexDirection: 'column' }}>
                  <Link to={`/admin/articles/${article.id}/edit`} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                    Éditer
                  </Link>
                  {article.status !== 'PUBLISHED' && (
                    <button onClick={() => handlePublish(article.id)} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                      Publier
                    </button>
                  )}
                  <button onClick={() => handleDelete(article.id)} className="btn btn-outline" style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline">
                Précédent
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--spacing-md)' }}>
                Page {page} sur {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn btn-outline"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

