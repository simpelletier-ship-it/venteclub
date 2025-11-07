// Templates d'emails professionnels pour Vente.club
// Inspirés de Stripe, Shopify, Airbnb, Notion

const BRAND_COLOR = "#007AFF";
const BRAND_NAME = "Vente.Club";

// Structure de base réutilisable
const getEmailLayout = (content: string, preheader: string = "") => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <title>${BRAND_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f7f7f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { padding: 32px 40px; text-align: center; border-bottom: 1px solid #e8e8e8; }
    .logo { font-size: 24px; font-weight: 600; color: #1a1a1a; text-decoration: none; }
    .logo-accent { color: ${BRAND_COLOR}; }
    .content { padding: 40px 40px; }
    .footer { padding: 32px 40px; background-color: #fafafa; border-top: 1px solid #e8e8e8; text-align: center; }
    .footer-text { font-size: 13px; color: #666666; line-height: 1.8; }
    .footer-links { margin-top: 16px; }
    .footer-link { color: #666666; text-decoration: none; margin: 0 8px; font-size: 13px; }
    .footer-link:hover { color: ${BRAND_COLOR}; }
    h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; line-height: 1.3; }
    p { font-size: 15px; color: #4a4a4a; margin-bottom: 16px; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 28px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; margin: 24px 0; }
    .button:hover { background-color: #0051D5; }
    .divider { border: 0; border-top: 1px solid #e8e8e8; margin: 32px 0; }
    .info-box { background-color: #f5f5f5; border-left: 3px solid ${BRAND_COLOR}; padding: 16px 20px; margin: 24px 0; border-radius: 4px; }
    .info-box p { margin-bottom: 0; font-size: 14px; color: #4a4a4a; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content, .header, .footer { padding: 24px 20px !important; }
      h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header">
              <a href="https://vente.club" class="logo">${BRAND_NAME}</a>
            </td>
          </tr>
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">
                ${BRAND_NAME} - Votre partenaire pour l'achat et la vente d'entreprises au Québec
              </p>
              <div class="footer-links">
                <a href="https://vente.club" class="footer-link">Accueil</a>
                <a href="https://vente.club/contact" class="footer-link">Contact</a>
                <a href="https://vente.club/terms" class="footer-link">Politique de confidentialité</a>
              </div>
              <p class="footer-text" style="margin-top: 16px; font-size: 12px;">
                <a href="{{unsubscribe_url}}" class="footer-link">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Template 1: Bienvenue / Confirmation de compte
export const getWelcomeEmail = (confirmationUrl: string, userEmail: string) => {
  const content = `
    <h1>Bienvenue sur ${BRAND_NAME}</h1>
    <p>Vous venez de créer un compte sur la plateforme de référence pour l'achat et la vente d'entreprises au Québec.</p>
    <p>Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse courriel.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${confirmationUrl}" class="button">Confirmer mon compte</a>
        </td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #666666;">Si vous n'avez pas créé de compte, vous pouvez ignorer ce message.</p>
    <hr class="divider">
    <div class="info-box">
      <p><strong>Ce lien expirera dans 24 heures.</strong></p>
    </div>
  `;
  return getEmailLayout(content, "Confirmez votre compte pour accéder à Vente.Club");
};

// Template 2: Réinitialisation de mot de passe
export const getPasswordResetEmail = (resetUrl: string, userEmail: string) => {
  const content = `
    <h1>Réinitialisation de mot de passe</h1>
    <p>Vous avez demandé la réinitialisation de votre mot de passe ${BRAND_NAME}.</p>
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #666666;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer ce message en toute sécurité.</p>
    <hr class="divider">
    <div class="info-box">
      <p><strong>Ce lien expirera dans 1 heure.</strong></p>
    </div>
  `;
  return getEmailLayout(content, "Réinitialisez votre mot de passe");
};

// Template 3: Notification de message reçu
export const getNewMessageEmail = (senderName: string, businessTitle: string, messagePreview: string, messageUrl: string) => {
  const content = `
    <h1>Nouveau message reçu</h1>
    <p>Vous avez reçu un message de <strong>${senderName}</strong> concernant l'annonce :</p>
    <p style="font-size: 16px; font-weight: 500; color: #1a1a1a;">${businessTitle}</p>
    <div class="info-box">
      <p>${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${messageUrl}" class="button">Voir le message</a>
        </td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #666666;">Répondez rapidement pour maintenir l'intérêt de votre interlocuteur.</p>
  `;
  return getEmailLayout(content, `Nouveau message de ${senderName}`);
};

// Template 4: Nouvelle opportunité publiée
export const getNewListingEmail = (businessTitle: string, businessPrice: string, businessLocation: string, businessUrl: string) => {
  const content = `
    <h1>Nouvelle opportunité disponible</h1>
    <p>Une nouvelle entreprise correspond à vos critères de recherche.</p>
    <div style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1a1a1a;">${businessTitle}</h2>
      <p style="margin-bottom: 8px;"><strong>Prix demandé :</strong> ${businessPrice}</p>
      <p style="margin-bottom: 0;"><strong>Localisation :</strong> ${businessLocation}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${businessUrl}" class="button">Voir l'annonce</a>
        </td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #666666;">Agissez rapidement, les meilleures opportunités partent vite.</p>
  `;
  return getEmailLayout(content, "Nouvelle opportunité qui correspond à vos critères");
};

// Template 5: Validation d'annonce
export const getListingApprovedEmail = (
  sellerName: string,
  businessTitle: string, 
  businessPrice: string,
  businessLocation: string,
  businessUrl: string
) => {
  const content = `
    <h1>Votre annonce est approuvée</h1>
    <p>Bonjour ${sellerName},</p>
    <p>Excellente nouvelle : votre annonce a été validée par notre équipe et est maintenant visible par tous les acheteurs potentiels.</p>
    
    <div style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 24px; margin: 24px 0; background-color: #fafafa;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a;">${businessTitle}</h2>
      <p style="margin-bottom: 8px; color: #4a4a4a;"><strong>Prix demandé :</strong> ${businessPrice}</p>
      <p style="margin-bottom: 8px; color: #4a4a4a;"><strong>Localisation :</strong> ${businessLocation}</p>
      <p style="margin-bottom: 0; color: #22c55e; font-weight: 500;"><strong>Statut :</strong> En ligne</p>
    </div>

    <p>Votre annonce est maintenant en ligne et accessible aux milliers d'acheteurs qui visitent ${BRAND_NAME} chaque jour.</p>
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${businessUrl}" class="button">Voir mon annonce en ligne</a>
        </td>
      </tr>
    </table>

    <hr class="divider">

    <div style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
      <p style="margin-bottom: 12px; font-weight: 600; color: #92400e;">Conseils pour maximiser vos chances de vente :</p>
      <p style="margin-bottom: 8px; font-size: 14px; color: #92400e;">• Répondez rapidement aux messages des acheteurs intéressés</p>
      <p style="margin-bottom: 8px; font-size: 14px; color: #92400e;">• Soyez transparent sur les informations financières</p>
      <p style="margin-bottom: 8px; font-size: 14px; color: #92400e;">• Mettez à jour votre annonce si nécessaire</p>
      <p style="margin-bottom: 0; font-size: 14px; color: #92400e;">• Consultez régulièrement vos notifications</p>
    </div>

    <div class="info-box">
      <p><strong>Option disponible :</strong> Mettez votre annonce en vedette pour apparaître en haut des résultats et augmenter sa visibilité de 300%.</p>
    </div>

    <p style="margin-top: 24px;">Nous vous souhaitons une vente réussie. Notre équipe reste à votre disposition pour toute question.</p>
    <p style="font-size: 14px; color: #666666; margin-top: 16px;">Cordialement,<br><strong>L'équipe ${BRAND_NAME}</strong></p>
  `;
  return getEmailLayout(content, "Votre annonce est en ligne");
};

// Template 6: Email de bienvenue post-signup
export const getPostSignupWelcomeEmail = (userName: string) => {
  const content = `
    <h1>Bienvenue sur ${BRAND_NAME}</h1>
    <p>Bonjour ${userName},</p>
    <p>Nous sommes heureux de vous accueillir sur ${BRAND_NAME}, votre plateforme pour acheter et vendre des entreprises au Québec.</p>
    <div style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 24px; margin: 24px 0; background-color: #fafafa;">
      <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a;">Ce que vous pouvez faire dès maintenant :</h2>
      <p style="margin-bottom: 8px;">• Parcourir des centaines d'entreprises à vendre</p>
      <p style="margin-bottom: 8px;">• Contacter directement les vendeurs</p>
      <p style="margin-bottom: 8px;">• Créer des alertes personnalisées</p>
      <p style="margin-bottom: 8px;">• Mettre vos annonces en vedette</p>
      <p style="margin-bottom: 0;">• Accéder à des outils d'évaluation</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://vente.club/entreprises" class="button">Explorer les opportunités</a>
        </td>
      </tr>
    </table>
    <p>Besoin d'aide ? Notre équipe est à votre disposition pour répondre à toutes vos questions.</p>
    <p style="font-size: 14px; color: #666666;">Cordialement,<br>L'équipe ${BRAND_NAME}</p>
  `;
  return getEmailLayout(content, "Bienvenue sur Vente.Club");
};

// Template 7: Rappel / Suivi
export const getReminderEmail = (userName: string, reminderType: 'trial_ending' | 'inactive' | 'follow_up', daysLeft?: number) => {
  let content = '';
  let preheader = '';
  
  if (reminderType === 'trial_ending' && daysLeft) {
    preheader = `Votre période d'essai se termine dans ${daysLeft} jours`;
    content = `
      <h1>Votre période d'essai se termine bientôt</h1>
      <p>Bonjour ${userName},</p>
      <p>Votre période d'essai du Club Select se termine dans <strong>${daysLeft} jours</strong>.</p>
      <p>Pour continuer à profiter de tous les avantages (accès illimité, contact direct avec les vendeurs, alertes personnalisées), pensez à renouveler votre abonnement.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="https://vente.club/club-select" class="button">Renouveler mon abonnement</a>
          </td>
        </tr>
      </table>
    `;
  } else if (reminderType === 'inactive') {
    preheader = "Nous aimerions vous revoir sur Vente.Club";
    content = `
      <h1>Avez-vous trouvé ce que vous cherchiez ?</h1>
      <p>Bonjour ${userName},</p>
      <p>Nous avons remarqué que vous n'avez pas visité ${BRAND_NAME} depuis quelque temps.</p>
      <p>De nouvelles opportunités sont ajoutées chaque jour. Peut-être que celle qui vous correspond est maintenant disponible.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="https://vente.club/entreprises" class="button">Voir les nouvelles opportunités</a>
          </td>
        </tr>
      </table>
    `;
  } else {
    preheader = "Besoin d'aide pour trouver la bonne entreprise ?";
    content = `
      <h1>Comment se passe votre recherche ?</h1>
      <p>Bonjour ${userName},</p>
      <p>Nous espérons que vous trouvez les opportunités que vous recherchez sur ${BRAND_NAME}.</p>
      <p>Notre équipe est disponible pour répondre à vos questions et vous accompagner dans votre démarche.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="https://vente.club/contact" class="button">Contactez notre équipe</a>
          </td>
        </tr>
      </table>
    `;
  }
  
  return getEmailLayout(content, preheader);
};

// Template 8: Achat d'accès contact réussi
export const getContactAccessPurchasedEmail = (businessTitle: string, sellerEmail: string, sellerPhone: string) => {
  const content = `
    <h1>Accès débloqué avec succès</h1>
    <p>Vous avez maintenant accès aux coordonnées du vendeur pour l'annonce :</p>
    <div class="info-box">
      <p><strong>${businessTitle}</strong></p>
    </div>
    <div style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 24px; margin: 24px 0; background-color: #fafafa;">
      <p style="margin-bottom: 12px;"><strong>Coordonnées du vendeur :</strong></p>
      <p style="margin-bottom: 8px;">Courriel : <a href="mailto:${sellerEmail}" style="color: ${BRAND_COLOR};">${sellerEmail}</a></p>
      ${sellerPhone ? `<p style="margin-bottom: 0;">Téléphone : <a href="tel:${sellerPhone}" style="color: ${BRAND_COLOR};">${sellerPhone}</a></p>` : ''}
    </div>
    <p>Vous pouvez maintenant contacter directement le vendeur pour discuter des détails de la transaction.</p>
    <p style="font-size: 14px; color: #666666;">Conseil : Préparez vos questions à l'avance pour une discussion productive.</p>
  `;
  return getEmailLayout(content, "Coordonnées du vendeur débloquées");
};

// Template 9: Notification vendeur - acheteur intéressé
export const getSellerNotificationEmail = (buyerName: string, businessTitle: string, conversationUrl: string) => {
  const content = `
    <h1>Un acheteur a débloqué vos coordonnées</h1>
    <p><strong>${buyerName}</strong> a débloqué vos coordonnées concernant votre annonce :</p>
    <div class="info-box">
      <p><strong>${businessTitle}</strong></p>
    </div>
    <p>Cette personne est sérieusement intéressée par votre entreprise. Nous vous recommandons de répondre rapidement.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${conversationUrl}" class="button">Voir la conversation</a>
        </td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #666666;">Conseil : Soyez professionnel et transparent dans vos échanges.</p>
  `;
  return getEmailLayout(content, `${buyerName} souhaite discuter avec vous`);
};
