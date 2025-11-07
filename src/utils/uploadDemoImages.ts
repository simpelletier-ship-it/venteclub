import { supabase } from "@/integrations/supabase/client";

export const uploadDemoImages = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-demo-images', {
      body: {}
    });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error uploading demo images:', error);
    throw error;
  }
};
