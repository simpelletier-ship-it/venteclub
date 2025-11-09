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
 * Truncate text to a specific length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
