import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import Header from './Header';
import Footer from './Footer';
import CookieBanner, { hasAnalyticsConsent } from './CookieBanner';
import { initGoogleAnalytics, removeGoogleAnalytics, trackPageView } from '../utils/analytics';
import Loading from './Loading';

interface LayoutProps {
  children: ReactNode;
  admin?: boolean;
}

export default function Layout({ children, admin = false }: LayoutProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [gaId, setGaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (admin) {
      let isMounted = true;
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isMounted && authenticated === null) {
          console.warn('Layout: Authentication check timeout, redirecting to login');
          setAuthenticated(false);
          navigate('/admin/login');
        }
      }, 5000); // 5 second timeout

      api
        .getMe()
        .then(() => {
          if (isMounted) {
            clearTimeout(timeout);
            setAuthenticated(true);
          }
        })
        .catch((error) => {
          console.error('Layout: Authentication check failed:', error);
          if (isMounted) {
            clearTimeout(timeout);
            setAuthenticated(false);
            navigate('/admin/login');
          }
        });

      return () => {
        isMounted = false;
        clearTimeout(timeout);
      };
    } else {
      // For public pages, set authenticated immediately (no auth needed)
      setAuthenticated(true);
    }
  }, [admin, navigate]);

  // Load Google Analytics ID from settings
  useEffect(() => {
    if (!admin) {
      api
        .getPublicSettings()
        .then((data) => {
          const analyticsId = data.settings?.['analytics.googleAnalyticsId'];
          if (analyticsId && analyticsId.trim()) {
            setGaId(analyticsId.trim());
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [admin]);

  // Initialize/update Google Analytics based on consent
  useEffect(() => {
    if (admin || !gaId) {
      return;
    }

    const handleConsentUpdate = (event: CustomEvent) => {
      const consent = event.detail;
      if (consent.analytics) {
        initGoogleAnalytics(gaId!);
      } else {
        removeGoogleAnalytics();
      }
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);

    // Check initial consent
    if (hasAnalyticsConsent()) {
      initGoogleAnalytics(gaId);
    }

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, [admin, gaId]);

  // Track page views
  useEffect(() => {
    if (!admin && gaId && hasAnalyticsConsent()) {
      trackPageView(location.pathname + location.search);
    }
  }, [admin, gaId, location]);

  if (authenticated === null) {
    return <Loading fullScreen message="Initialisation" />;
  }

  if (admin && !authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header admin={admin} />
      <main className="flex-grow">{children}</main>
      {!admin && <Footer />}
      {!admin && <CookieBanner />}
    </div>
  );
}

