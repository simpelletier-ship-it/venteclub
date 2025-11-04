import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAutosaveDraftOptions {
  formData: Record<string, any>;
  userId: string | undefined;
  draftType: 'business' | 'property' | 'franchise';
  editingBusinessId?: string | null;
  minFieldsFilled?: number;
}

export const useAutosaveDraft = ({
  formData,
  userId,
  draftType,
  editingBusinessId,
  minFieldsFilled = 2
}: UseAutosaveDraftOptions) => {
  const { toast } = useToast();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isDraftingRef = useRef(false);

  // Check if minimum fields are filled
  const hasMinimumContent = useCallback(() => {
    const fieldsWithContent = Object.values(formData).filter(
      value => value && String(value).trim() !== ''
    ).length;
    return fieldsWithContent >= minFieldsFilled;
  }, [formData, minFieldsFilled]);

  // Save draft to database
  const saveDraftToDatabase = useCallback(async () => {
    if (!userId || !hasMinimumContent() || editingBusinessId || isDraftingRef.current) {
      return;
    }

    try {
      isDraftingRef.current = true;

      // Prepare draft data with common fields
      const commonData = {
        seller_id: userId,
        title: formData.title || 'Brouillon sans titre',
        description: formData.description || '',
        location: formData.location || formData.city || '',
        city: formData.city || '',
        province: formData.province || 'Québec',
        status: 'draft',
        approval_status: 'draft',
      };

      let draftData: any = { ...commonData };

      // Add type-specific fields
      if (draftType === 'business') {
        draftData.industry = formData.industry || 'boutique_commerce_detail';
        draftData.annual_revenue = formData.annual_revenue ? parseFloat(formData.annual_revenue) : null;
        draftData.asking_price = formData.asking_price ? parseFloat(formData.asking_price) : null;
      } else if (draftType === 'property') {
        draftData.industry = 'boutique_commerce_detail';
        draftData.property_type = formData.property_type || null;
        draftData.asking_price = formData.asking_price ? parseFloat(formData.asking_price) : null;
        draftData.year_built = formData.year_built ? parseInt(formData.year_built) : null;
        draftData.square_footage = formData.square_footage ? parseFloat(formData.square_footage) : null;
      } else if (draftType === 'franchise') {
        draftData.industry = formData.industry || 'franchise';
        draftData.is_franchise = true;
        draftData.asking_price = formData.franchise_fee ? parseFloat(formData.franchise_fee) : null;
        draftData.franchise_fee = formData.franchise_fee ? parseFloat(formData.franchise_fee) : null;
      }

      // Check if draft already exists
      const { data: existingDraft } = await supabase
        .from('businesses')
        .select('id')
        .eq('seller_id', userId)
        .eq('status', 'draft')
        .maybeSingle();

      if (existingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from('businesses')
          .update(draftData)
          .eq('id', existingDraft.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase
          .from('businesses')
          .insert([draftData]);

        if (error) throw error;

        toast({
          title: "Brouillon sauvegardé",
          description: "Votre annonce a été sauvegardée automatiquement",
          duration: 2000,
        });
      }

      lastSavedDataRef.current = JSON.stringify(formData);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      isDraftingRef.current = false;
    }
  }, [userId, formData, draftType, editingBusinessId, hasMinimumContent, toast]);

  // Load existing draft
  const loadDraft = useCallback(async () => {
    if (!userId || editingBusinessId) return null;

    try {
      const { data: draft, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('seller_id', userId)
        .eq('status', 'draft')
        .maybeSingle();

      if (error) throw error;

      if (draft) {
        // Return the draft data as form data
        return {
          title: draft.title || '',
          description: draft.description || '',
          industry: draft.industry || '',
          location: draft.location || '',
          city: draft.city || '',
          province: draft.province || 'Québec',
          annual_revenue: draft.annual_revenue?.toString() || '',
          asking_price: draft.asking_price?.toString() || '',
          property_type: draft.property_type || '',
          year_built: draft.year_built?.toString() || '',
          square_footage: draft.square_footage?.toString() || '',
          franchise_fee: draft.franchise_fee?.toString() || '',
        };
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }

    return null;
  }, [userId, editingBusinessId]);

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase
        .from('businesses')
        .delete()
        .eq('seller_id', userId)
        .eq('status', 'draft');
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [userId]);

  // Autosave effect
  useEffect(() => {
    if (!userId || !hasMinimumContent() || editingBusinessId) {
      return;
    }

    const currentData = JSON.stringify(formData);
    
    // Only save if data has changed
    if (currentData !== lastSavedDataRef.current) {
      // Clear existing timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      // Set new timer for autosave (every 30 seconds after changes)
      autosaveTimerRef.current = setTimeout(() => {
        saveDraftToDatabase();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, userId, editingBusinessId, hasMinimumContent, saveDraftToDatabase]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasMinimumContent() && !editingBusinessId) {
        saveDraftToDatabase();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasMinimumContent, editingBusinessId, saveDraftToDatabase]);

  return {
    loadDraft,
    deleteDraft,
    saveDraft: saveDraftToDatabase,
  };
};
