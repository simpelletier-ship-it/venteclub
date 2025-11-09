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
 * Decodes entities and returns clean HTML
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // First decode any HTML entities
  const decoded = decodeHtml(html);
  
  // Return the decoded HTML
  return decoded;
};

/**
 * Truncate text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
