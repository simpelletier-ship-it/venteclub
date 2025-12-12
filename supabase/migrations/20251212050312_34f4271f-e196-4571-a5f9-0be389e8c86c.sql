-- Supprimer toutes les politiques RLS dupliquées sur profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insertion automatique lors de la création du compte" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Créer des politiques consolidées et sécurisées
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);