/**
 * Lazy load reCAPTCHA only when needed
 * Improves initial page load performance
 */

let recaptchaLoaded = false;
let recaptchaPromise: Promise<void> | null = null;

export const loadRecaptcha = (): Promise<void> => {
  // Return existing promise if already loading
  if (recaptchaPromise) {
    return recaptchaPromise;
  }

  // Return resolved promise if already loaded
  if (recaptchaLoaded) {
    return Promise.resolve();
  }

  // Load reCAPTCHA script
  recaptchaPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      recaptchaLoaded = true;
      recaptchaPromise = null;
      resolve();
    };
    
    script.onerror = () => {
      recaptchaPromise = null;
      reject(new Error('Failed to load reCAPTCHA'));
    };
    
    document.head.appendChild(script);
  });

  return recaptchaPromise;
};
