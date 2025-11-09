/**
 * Google Ads Conversion Tracking Utilities
 * Pour suivre les conversions sur le site
 */

/**
 * Envoie un événement de conversion à Google Ads
 * @param conversionLabel - Le label de conversion de Google Ads (format: CONVERSION_LABEL)
 * @param value - Valeur de la conversion (optionnel)
 */
export const trackGoogleAdsConversion = (
  conversionLabel?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    console.warn('Google Ads tag not loaded');
    return;
  }
  
  const gtag = (window as any).gtag;

  try {
    // Si un label est fourni, l'utiliser
    if (conversionLabel) {
      gtag('event', 'conversion', {
        send_to: `AW-974642760/${conversionLabel}`,
        value: value || 1.0,
        currency: 'CAD',
      });
      console.log('Google Ads conversion sent:', conversionLabel);
    } else {
      // Sinon, envoyer un événement de page vue
      gtag('event', 'page_view', {
        send_to: 'AW-974642760',
      });
      console.log('Google Ads page view sent');
    }
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error);
  }
};

/**
 * Envoie un événement de page vue à Google Ads avec conversion de trafic
 */
export const trackPageView = () => {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    return;
  }
  
  const gtag = (window as any).gtag;

  try {
    // Événement de conversion pour le trafic du site
    gtag('event', 'conversion', {
      'send_to': 'AW-974642760/z7Q0CLnYktUDEMi839AD'
    });
    console.log('Google Ads website traffic conversion sent');
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Envoie un événement de conversion pour la création de compte
 */
export const trackSignupConversion = () => {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    console.warn('Google Ads tag not loaded');
    return;
  }
  
  const gtag = (window as any).gtag;

  try {
    gtag('event', 'conversion_event_signup', {
      send_to: 'AW-974642760'
    });
    console.log('Google Ads signup conversion sent');
  } catch (error) {
    console.error('Error tracking signup conversion:', error);
  }
};

/**
 * Envoie un événement personnalisé à Google Ads
 */
export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined' || !(window as any).gtag) {
    return;
  }
  
  const gtag = (window as any).gtag;

  try {
    gtag('event', eventName, {
      send_to: 'AW-974642760',
      ...params,
    });
    console.log('Google Ads event sent:', eventName);
  } catch (error) {
    console.error('Error tracking custom event:', error);
  }
};
