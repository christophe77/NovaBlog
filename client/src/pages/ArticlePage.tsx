import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    api
      .getArticle(slug)
      .then((data) => {
        setArticle(data.article);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (article) {
      document.title = article.seoTitle || article.title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', article.seoDescription || article.excerpt || '');
      }
    }
  }, [article]);

  if (loading) {
    return <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>Loading...</div>;
  }

  if (!article) {
    return (
      <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
        <h1>Article non trouvé</h1>
        <p>L'article que vous recherchez n'existe pas ou n'est pas encore publié.</p>
      </div>
    );
  }

  // Render HTML content from Quill editor
  const renderContent = (content: string) => {
    // Check if content is HTML (contains HTML tags) or plain text
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    
    if (isHTML) {
      return (
        <div
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontSize: '1.125rem',
            lineHeight: 'var(--line-height-relaxed)',
            color: '#374151',
          }}
        />
      );
    }
    
    // Fallback for plain text (backward compatibility)
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`} style={{ marginBottom: 'var(--spacing-md)', lineHeight: 'var(--line-height-relaxed)' }}>{currentParagraph.join(' ')}</p>);
          currentParagraph = [];
        }
        elements.push(
          <h2 key={`h2-${index}`} style={{ fontSize: '1.75rem', marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)', fontWeight: 'bold' }}>
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.trim()) {
        currentParagraph.push(line.trim());
      } else {
        if (currentParagraph.length > 0) {
          elements.push(<p key={`p-${index}`} style={{ marginBottom: 'var(--spacing-md)', lineHeight: 'var(--line-height-relaxed)' }}>{currentParagraph.join(' ')}</p>);
          currentParagraph = [];
        }
      }
    });

    if (currentParagraph.length > 0) {
      elements.push(<p key="p-final" style={{ marginBottom: 'var(--spacing-md)', lineHeight: 'var(--line-height-relaxed)' }}>{currentParagraph.join(' ')}</p>);
    }

    return <div>{elements}</div>;
  };

  return (
    <article className="container" style={{ padding: 'var(--spacing-2xl) 0', maxWidth: '800px' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        {article.image && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <img
              src={article.image}
              alt={article.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
          </div>
        )}
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)', lineHeight: 'var(--line-height-tight)' }}>
          {article.title}
        </h1>
        {article.publishedAt && (
          <time style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}
      </header>

      <div>
        {renderContent(article.content)}
        <style>{`
          .ql-editor {
            font-size: 1.125rem;
            line-height: var(--line-height-relaxed);
            color: #374151;
          }
          .ql-editor h1 {
            font-size: 2rem;
            font-weight: bold;
            margin-top: var(--spacing-xl);
            margin-bottom: var(--spacing-md);
            line-height: var(--line-height-tight);
          }
          .ql-editor h2 {
            font-size: 1.75rem;
            font-weight: bold;
            margin-top: var(--spacing-xl);
            margin-bottom: var(--spacing-md);
          }
          .ql-editor h3 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: var(--spacing-lg);
            margin-bottom: var(--spacing-sm);
          }
          .ql-editor h4, .ql-editor h5, .ql-editor h6 {
            font-size: 1.25rem;
            font-weight: bold;
            margin-top: var(--spacing-md);
            margin-bottom: var(--spacing-sm);
          }
          .ql-editor p {
            margin-bottom: var(--spacing-md);
            line-height: var(--line-height-relaxed);
          }
          .ql-editor ul, .ql-editor ol {
            margin: var(--spacing-md) 0;
            padding-left: var(--spacing-xl);
          }
          .ql-editor li {
            margin-bottom: var(--spacing-xs);
          }
          .ql-editor blockquote {
            border-left: 4px solid var(--color-primary);
            padding-left: var(--spacing-md);
            margin: var(--spacing-md) 0;
            color: #6b7280;
            font-style: italic;
          }
          .ql-editor code {
            background: #f3f4f6;
            border-radius: var(--radius-sm);
            padding: 2px 6px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          .ql-editor pre {
            background: #f3f4f6;
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin: var(--spacing-md) 0;
            overflow-x: auto;
          }
          .ql-editor pre code {
            background: none;
            padding: 0;
          }
          .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: var(--radius-md);
            margin: var(--spacing-md) 0;
          }
          .ql-editor a {
            color: var(--color-primary);
            text-decoration: underline;
          }
          .ql-editor a:hover {
            text-decoration: none;
          }
          .ql-editor video {
            max-width: 100%;
            border-radius: var(--radius-md);
            margin: var(--spacing-md) 0;
          }
        `}</style>
      </div>

      {article.keywords && (
        <footer style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Mots-clés : {JSON.parse(article.keywords).join(', ')}
          </p>
        </footer>
      )}
    </article>
  );
}

