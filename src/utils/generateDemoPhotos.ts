import { supabase } from "@/integrations/supabase/client";

export const generateDemoPhotos = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-demo-business-photos', {
      body: {}
    });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error generating demo photos:', error);
    throw error;
  }
};
