import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface HeaderProps {
  admin?: boolean;
}

export default function Header({ admin = false }: HeaderProps) {
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) {
      api
        .getPublicSettings()
        .then((data) => {
          if (data.settings && data.settings['company.logo']) {
            setLogo(data.settings['company.logo']);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [admin]);

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (admin) {
    return (
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--spacing-md)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/admin" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            InnovLayer Admin
          </Link>
          <nav style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/articles">Articles</Link>
            <Link to="/admin/homepage">Page d'accueil</Link>
            <Link to="/admin/settings">Settings</Link>
            <Link to="/">View Site</Link>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
              Logout
            </button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--spacing-lg) 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}>
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              style={{
                height: '40px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              InnovLayer
            </span>
          )}
        </Link>
        <nav style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
          <Link to="/">Home</Link>
          <Link to="/blog">Blog</Link>
        </nav>
      </div>
    </header>
  );
}

