// Google Analytics 4 helper functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * Track a page view in Google Analytics
 */
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-362DNT7Q72', {
      page_path: url,
      page_title: title,
    });
  }
};

/**
 * Track a custom event in Google Analytics
 */
export const trackEvent = (
  eventName: string,
  eventParams?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track user signup
 */
export const trackSignup = (method: string = 'email') => {
  trackEvent('sign_up', {
    method: method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string = 'email') => {
  trackEvent('login', {
    method: method,
  });
};

/**
 * Track business listing view
 */
export const trackBusinessView = (businessId: string, businessTitle: string, category: string) => {
  trackEvent('view_item', {
    item_id: businessId,
    item_name: businessTitle,
    item_category: category,
  });
};

/**
 * Track business listing creation
 */
export const trackBusinessCreated = (businessId: string, category: string) => {
  trackEvent('create_listing', {
    item_id: businessId,
    item_category: category,
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track contact unlock (chat or phone)
 */
export const trackContactUnlock = (businessId: string, unlockType: 'chat' | 'purchase') => {
  trackEvent('unlock_contact', {
    item_id: businessId,
    unlock_type: unlockType,
  });
};

/**
 * Track message sent
 */
export const trackMessageSent = (businessId: string) => {
  trackEvent('send_message', {
    item_id: businessId,
  });
};

/**
 * Track premium subscription
 */
export const trackPremiumSubscription = (plan: string, value: number) => {
  trackEvent('purchase', {
    transaction_id: Date.now().toString(),
    value: value,
    currency: 'CAD',
    items: [{
      item_id: 'premium_subscription',
      item_name: plan,
      price: value,
      quantity: 1,
    }],
  });
};

/**
 * Track add to favorites
 */
export const trackAddToFavorites = (businessId: string) => {
  trackEvent('add_to_wishlist', {
    item_id: businessId,
  });
};

/**
 * Track filter usage
 */
export const trackFilterUsage = (filterType: string, filterValue: string) => {
  trackEvent('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

/**
 * Track engagement time on page
 */
export const trackEngagement = (pageName: string, timeInSeconds: number) => {
  trackEvent('user_engagement', {
    page_name: pageName,
    engagement_time_msec: timeInSeconds * 1000,
  });
};
