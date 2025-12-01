import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>(token ? 'reset' : 'login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      alert('Si cet email existe, un lien de réinitialisation a été envoyé.');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      alert('Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
      navigate('/admin/login');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
          {mode === 'login' && 'Connexion Admin'}
          {mode === 'forgot' && 'Mot de passe oublié'}
          {mode === 'reset' && 'Réinitialiser le mot de passe'}
        </h1>

        {error && (
          <div style={{ padding: 'var(--spacing-sm)', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              style={{ marginTop: 'var(--spacing-sm)', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ marginTop: 'var(--spacing-sm)', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Retour à la connexion
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe (min 8 caractères)</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

