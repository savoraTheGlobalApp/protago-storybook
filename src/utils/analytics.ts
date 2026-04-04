declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let initialized = false;

export function initGA4() {
  if (initialized) return;
  initialized = true;

  // If gtag is already loaded from index.html, just ensure window.gtag is available
  if (typeof window.gtag === 'function') return;

  // Fallback: dynamically load if not in index.html (e.g. env-var driven)
  if (!GA4_ID || GA4_ID === 'G-XXXXXXXXXX') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackButtonClick(buttonName: string, section?: string) {
  trackEvent('button_click', {
    button_name: buttonName,
    section: section || 'unknown',
  });
}

export function trackFormInteraction(action: string, fieldName?: string) {
  trackEvent('form_interaction', {
    action,
    field_name: fieldName || '',
  });
}

export function trackSectionView(sectionName: string) {
  trackEvent('section_view', {
    section_name: sectionName,
  });
}
