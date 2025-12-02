import { hasAnalyticsConsent } from '../components/CookieBanner';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let analyticsInitialized = false;
let gaId: string | null = null;

export function initGoogleAnalytics(gaIdParam: string) {
  if (!gaIdParam || analyticsInitialized) {
    return;
  }

  gaId = gaIdParam;

  // Check consent before initializing
  if (!hasAnalyticsConsent()) {
    console.log('Analytics consent not given, skipping initialization');
    return;
  }

  // Initialize Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script1);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: any[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', gaId, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  analyticsInitialized = true;
  console.log('Google Analytics initialized:', gaId);
}

export function removeGoogleAnalytics() {
  // Remove gtag script
  const scripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
  scripts.forEach((script) => script.remove());

  // Clear dataLayer
  if (window.dataLayer) {
    window.dataLayer = [];
  }

  // Remove gtag function
  delete window.gtag;

  analyticsInitialized = false;
  console.log('Google Analytics removed');
}

export function trackPageView(path: string) {
  if (window.gtag && hasAnalyticsConsent()) {
    window.gtag('config', gaId, {
      page_path: path,
    });
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (window.gtag && hasAnalyticsConsent()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

