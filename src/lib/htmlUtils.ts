import DOMPurify from 'dompurify';

/**
 * Extract plain text from HTML string
 * Removes all HTML tags and returns clean text
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary div element to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Get text content (automatically strips HTML tags)
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Decode HTML entities and ensure proper HTML rendering
 * Handles double-encoded HTML (e.g., &lt;p&gt; becomes <p>)
 */
export const decodeHtml = (html: string): string => {
  if (!html) return '';
  
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

/**
 * Sanitize and prepare HTML for safe rendering
 * Uses DOMPurify to prevent XSS attacks while allowing safe formatting tags
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // First decode any HTML entities
  const decoded = decodeHtml(html);
  
  // Sanitize with DOMPurify - only allow safe formatting tags
  const clean = DOMPurify.sanitize(decoded, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true
  });
  
  return clean;
};

/**
 * Truncate text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
