-- Ajouter la colonne read_at pour stocker l'heure de lecture
ALTER TABLE public.messages 
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Créer un index sur read_at pour améliorer les performances
CREATE INDEX idx_messages_read_at ON public.messages(read_at);

-- Activer RLS sur la table messages si ce n'est pas déjà fait
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les messages où ils sont soit l'expéditeur soit le destinataire
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy: Les utilisateurs peuvent insérer des messages où ils sont l'expéditeur
CREATE POLICY "Users can insert messages as sender"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- Policy: Les utilisateurs peuvent mettre à jour les messages où ils sont le destinataire (pour marquer comme lu)
CREATE POLICY "Users can update messages as receiver"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = receiver_id
);

-- Activer RLS sur message_attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les pièces jointes des messages auxquels ils ont accès
CREATE POLICY "Users can view message attachments"
ON public.message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_attachments.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Policy: Les utilisateurs peuvent insérer des pièces jointes pour leurs propres messages
CREATE POLICY "Users can insert message attachments"
ON public.message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_attachments.message_id
    AND messages.sender_id = auth.uid()
  )
);

-- Créer une fonction pour mettre à jour automatiquement read_at quand read passe à true
CREATE OR REPLACE FUNCTION public.update_message_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Si le message vient d'être marqué comme lu, mettre à jour read_at
  IF NEW.read = true AND (OLD.read = false OR OLD.read IS NULL) THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attacher le trigger à la table messages
DROP TRIGGER IF EXISTS trigger_update_message_read_at ON public.messages;
CREATE TRIGGER trigger_update_message_read_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_message_read_at();