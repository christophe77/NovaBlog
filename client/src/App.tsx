import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import ArticlePage from './pages/ArticlePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminArticlesPage from './pages/admin/AdminArticlesPage';
import AdminArticleEditPage from './pages/admin/AdminArticleEditPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminHomepagePage from './pages/admin/AdminHomepagePage';
import SetupPage from './pages/SetupPage';
import { applyThemeTokens } from './utils/theme';
import { api } from './utils/api';

function App() {
  const [themeLoaded, setThemeLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Load theme tokens from API and apply them
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          applyThemeTokens(data.settings);
        }
        setThemeLoaded(true);
      })
      .catch(() => {
        setThemeLoaded(true);
      });

    // Check if setup is needed (except on setup page and API routes)
    if (!location.pathname.startsWith('/setup') && !location.pathname.startsWith('/api')) {
      api
        .getSetupStatus()
        .then((data) => {
          if (!data.setupComplete && location.pathname !== '/setup') {
            navigate('/setup');
          }
        })
        .catch((error) => {
          // Ignore errors, might be first load or DB not ready
          console.log('Setup check failed (this is OK on first run):', error);
        });
    }
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/reset-password" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <Layout admin>
            <AdminDashboardPage />
          </Layout>
        }
      />
      <Route
        path="/admin/articles"
        element={
          <Layout admin>
            <AdminArticlesPage />
          </Layout>
        }
      />
      <Route
        path="/admin/articles/new"
        element={
          <Layout admin>
            <AdminArticleEditPage />
          </Layout>
        }
      />
      <Route
        path="/admin/articles/:id/edit"
        element={
          <Layout admin>
            <AdminArticleEditPage />
          </Layout>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <Layout admin>
            <AdminSettingsPage />
          </Layout>
        }
      />
      <Route
        path="/admin/homepage"
        element={
          <Layout admin>
            <AdminHomepagePage />
          </Layout>
        }
      />
      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/blog"
        element={
          <Layout>
            <BlogPage />
          </Layout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <Layout>
            <ArticlePage />
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;

