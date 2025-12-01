import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function BlogPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getArticles({ page, limit: 10 })
      .then((data) => {
        setArticles(data.articles);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xl)' }}>Blog</h1>

      {articles.length === 0 ? (
        <p>Aucun article publié pour le moment.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {articles.map((article) => (
              <article key={article.id} className="card">
                {article.image && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <Link to={`/blog/${article.slug}`}>
                      <img
                        src={article.image}
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                        }}
                      />
                    </Link>
                  </div>
                )}
                <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>
                  <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                </h2>
                {article.excerpt && (
                  <p style={{ color: '#6b7280', marginBottom: 'var(--spacing-sm)', lineHeight: 'var(--line-height-relaxed)' }}>
                    {article.excerpt}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-md)' }}>
                  {article.publishedAt && (
                    <time style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                  <Link to={`/blog/${article.slug}`} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                    Lire la suite →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline"
              >
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

