import { useEffect, useState } from 'react';

interface CookieConsent {
  analytics: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    // Check if consent was already given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent) as CookieConsent;
        setConsent(parsed);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      analytics: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    // Trigger analytics initialization
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: newConsent }));
  };

  const handleRejectAll = () => {
    const newConsent: CookieConsent = {
      analytics: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    // Trigger analytics cleanup if needed
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: newConsent }));
  };

  const handleCustomize = () => {
    // For now, we'll just show accept/reject. Can be extended for granular control
    // This could open a modal with more options
    handleAcceptAll();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1f2937',
        color: 'white',
        padding: 'var(--spacing-lg)',
        zIndex: 1000,
        boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
            🍪 Cookies et confidentialité
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#d1d5db', lineHeight: 1.5 }}>
            Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic du site. 
            Vous pouvez accepter tous les cookies ou les refuser. 
            <a href="/privacy" style={{ color: '#60a5fa', textDecoration: 'underline', marginLeft: '4px' }}>
              En savoir plus
            </a>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <button
            onClick={handleRejectAll}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: 'transparent',
              border: '1px solid #6b7280',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Refuser
          </button>
          <button
            onClick={handleAcceptAll}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              background: 'var(--color-primary)',
              border: 'none',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Accepter tout
          </button>
        </div>
      </div>
    </div>
  );
}

export function getCookieConsent(): CookieConsent | null {
  const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as CookieConsent;
    } catch {
      return null;
    }
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

