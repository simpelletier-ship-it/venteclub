/**
 * Traduit les messages d'erreur d'authentification en français
 */
export const translateAuthError = (errorMessage: string): string => {
  const errorMap: Record<string, string> = {
    // Erreurs d'inscription
    "User already registered": "Un compte avec cet email existe déjà",
    "user already registered": "Un compte avec cet email existe déjà",
    "Email already registered": "Un compte avec cet email existe déjà",
    "email already registered": "Un compte avec cet email existe déjà",
    "User already exists": "Un compte avec cet email existe déjà",
    
    // Erreurs de connexion
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "invalid login credentials": "Email ou mot de passe incorrect",
    "Invalid email or password": "Email ou mot de passe incorrect",
    "Email not confirmed": "Vous devez confirmer votre email avant de vous connecter",
    "email_not_confirmed": "Vous devez confirmer votre email avant de vous connecter",
    
    // Erreurs de mot de passe
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
    "password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
    "Password is too weak": "Le mot de passe est trop faible",
    
    // Erreurs d'email
    "Invalid email": "Adresse email invalide",
    "invalid email": "Adresse email invalide",
    "Email rate limit exceeded": "Trop de tentatives. Veuillez réessayer plus tard",
    
    // Erreurs réseau
    "Failed to fetch": "Erreur de connexion au serveur",
    "Network request failed": "Erreur de connexion réseau",
    
    // Erreurs générales
    "Invalid credentials": "Identifiants invalides",
    "invalid credentials": "Identifiants invalides",
    "Database error": "Erreur du système. Veuillez réessayer",
    "Too many requests": "Trop de tentatives. Veuillez patienter quelques minutes",
  };

  // Chercher une correspondance exacte
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // Chercher une correspondance partielle (insensible à la casse)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Message par défaut si aucune correspondance
  return "Une erreur est survenue. Veuillez réessayer";
};
