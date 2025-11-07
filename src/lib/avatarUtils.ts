/**
 * Generate a default avatar URL based on user's name or email
 * Uses DiceBear API to generate consistent, colorful avatars
 */
export const getDefaultAvatar = (name?: string | null, email?: string | null): string => {
  // Use name if available, otherwise use email, otherwise use 'User'
  const seed = name || email || 'User';
  
  // DiceBear API with initials style - generates colorful avatars based on the seed
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0891b2,7c3aed,db2777,dc2626,ea580c`;
};

/**
 * Get avatar URL - returns user's avatar if available, otherwise generates a default one
 */
export const getAvatarUrl = (
  avatarUrl?: string | null, 
  name?: string | null, 
  email?: string | null
): string => {
  return avatarUrl || getDefaultAvatar(name, email);
};
