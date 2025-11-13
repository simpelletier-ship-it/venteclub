import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TransactionTag {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TransactionTagManagerProps {
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export const TransactionTagManager = ({ selectedTags, onTagsChange }: TransactionTagManagerProps) => {
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user's tags
  const { data: tags = [] } = useQuery({
    queryKey: ['transaction-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as TransactionTag[];
    },
  });

  // Create new tag
  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('transaction_tags')
        .insert([{ 
          user_id: user.id,
          name, 
          color: '#6366f1', 
          icon: '🏷️' 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-tags'] });
      onTagsChange([...selectedTags, newTag.id]);
      setNewTagName("");
      setIsCreating(false);
      toast.success("Tag créé");
    },
    onError: () => {
      toast.error("Erreur lors de la création du tag");
    },
  });

  // Delete tag
  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('transaction_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-tags'] });
      toast.success("Tag supprimé");
    },
  });

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Le nom du tag ne peut pas être vide");
      return;
    }
    createTag.mutate(newTagName.trim());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tags (facultatif)</label>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau tag</DialogTitle>
              <DialogDescription>
                Les tags vous permettent de classifier vos transactions de manière flexible
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Nom du tag (ex: vacances, cadeau, urgent)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTag();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateTag}
                disabled={createTag.isPending}
                className="w-full"
              >
                {createTag.isPending ? "Création..." : "Créer le tag"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun tag créé. Créez votre premier tag pour commencer.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1"
              onClick={() => toggleTag(tag.id)}
            >
              <span className="mr-1">{tag.icon}</span>
              {tag.name}
              {selectedTags.includes(tag.id) && (
                <X
                  className="h-3 w-3 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTag(tag.id);
                  }}
                />
              )}
            </Badge>
          ))}
        </div>
      )}

      {tags.length > 0 && selectedTags.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} tag(s) sélectionné(s)
        </p>
      )}
    </div>
  );
};
