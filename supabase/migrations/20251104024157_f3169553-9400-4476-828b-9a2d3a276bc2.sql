-- Politiques RLS pour la table profiles

-- Permettre à tout le monde de voir les profils publics
CREATE POLICY "Les profils publics sont visibles par tous"
ON public.profiles
FOR SELECT
USING (is_public = true OR auth.uid() = id);

-- Permettre aux utilisateurs de voir leur propre profil (même s'il n'est pas public)
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permettre l'insertion lors de la création du compte (via trigger)
CREATE POLICY "Insertion automatique lors de la création du compte"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);