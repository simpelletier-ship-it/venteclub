-- Permettre aux utilisateurs de supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Mettre à jour les textes des notifications pour être plus professionnels

-- 1. Trigger pour la création d'une nouvelle annonce (notification au vendeur)
CREATE OR REPLACE FUNCTION public.notify_seller_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifier le vendeur que son annonce est en attente d'approbation
  INSERT INTO notifications (user_id, business_id, type, message)
  VALUES (
    NEW.seller_id,
    NEW.id,
    'new_listing',
    'Votre annonce "' || NEW.title || '" a été soumise avec succès. Notre équipe procèdera à sa vérification sous 24 heures.'
  );
  RETURN NEW;
END;
$$;

-- 2. Trigger pour l'approbation d'une annonce
CREATE OR REPLACE FUNCTION public.notify_business_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.seller_id,
      NEW.id,
      'approved',
      'Félicitations ! Votre annonce "' || NEW.title || '" a été approuvée et est maintenant visible par tous les acheteurs potentiels.'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Trigger pour les alertes utilisateurs (nouvelles annonces approuvées)
CREATE OR REPLACE FUNCTION public.notify_user_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND NEW.status = 'active' AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.approval_status != 'approved')) THEN
    
    -- Alertes pour toutes les nouvelles annonces
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle opportunité disponible : "' || NEW.title || '" dans la catégorie ' || NEW.industry::text || '.'
    FROM user_alerts ua
    WHERE ua.alert_type = 'all' 
      AND ua.user_id != NEW.seller_id;
    
    -- Alertes par catégorie
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle entreprise dans votre catégorie suivie : "' || NEW.title || '" - ' || NEW.industry::text || '.'
    FROM user_alerts ua
    WHERE ua.alert_type = 'category' 
      AND ua.category = NEW.industry::text
      AND ua.user_id != NEW.seller_id;
    
    -- Alertes par ville
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle entreprise disponible à ' || NEW.city || ' : "' || NEW.title || '".'
    FROM user_alerts ua
    WHERE ua.alert_type = 'city' 
      AND ua.city = NEW.city
      AND ua.user_id != NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Trigger pour baisse de prix
CREATE OR REPLACE FUNCTION notify_price_drop()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.asking_price < OLD.asking_price THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'price_drop',
      'Réduction de prix sur "' || NEW.title || '" : ' || 
      CASE 
        WHEN NEW.currency = 'CAD' THEN '$' 
        WHEN NEW.currency = 'USD' THEN '$' 
        ELSE NEW.currency || ' '
      END || 
      NEW.asking_price::text || '. Ne manquez pas cette opportunité !'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger pour entreprise vendue
CREATE OR REPLACE FUNCTION notify_business_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'sold',
      'L''entreprise "' || NEW.title || '" que vous suiviez a été vendue. Découvrez d''autres opportunités similaires.'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour nombre élevé de vues
CREATE OR REPLACE FUNCTION notify_high_views()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.views_count >= 100 AND OLD.views_count < 100) OR
     (NEW.views_count >= 500 AND OLD.views_count < 500) OR
     (NEW.views_count >= 1000 AND OLD.views_count < 1000) THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'high_views',
      'L''entreprise "' || NEW.title || '" génère un fort intérêt avec ' || NEW.views_count::text || ' vues. Agissez rapidement !'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;