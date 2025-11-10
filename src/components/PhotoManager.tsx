import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, ArrowUp, ArrowDown, AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type PhotoStatus = "uploading" | "success" | "error" | "invalid";

export interface PhotoItem {
  url: string;
  status?: PhotoStatus;
  error?: string;
}

interface SortablePhotoItemProps {
  id: string;
  photo: PhotoItem;
  index: number;
  isFirst: boolean;
  totalCount: number;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onRetry?: (index: number) => void;
}

function SortablePhotoItem({
  id,
  photo,
  index,
  isFirst,
  totalCount,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRetry,
}: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = () => {
    switch (photo.status) {
      case "uploading": return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      case "error": return "border-destructive bg-destructive/10";
      case "invalid": return "border-orange-500 bg-orange-50 dark:bg-orange-950";
      case "success": return "border-green-500 bg-green-50 dark:bg-green-950";
      default: return "";
    }
  };

  const getStatusIcon = () => {
    switch (photo.status) {
      case "uploading": 
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error": 
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "invalid": 
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "success": 
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: 
        return null;
    }
  };

  const isUploading = photo.status === "uploading";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group border rounded-lg p-2 bg-card transition-all",
        isDragging && "opacity-50 z-50 shadow-lg scale-105",
        getStatusColor()
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing flex-shrink-0 pt-1 touch-none",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>

        {/* Photo avec overlay status */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <img
            src={photo.url}
            alt={`Photo ${index + 1}`}
            className={cn(
              "w-full h-full object-cover rounded-md pointer-events-none",
              isUploading && "opacity-50",
              photo.status === "error" && "opacity-60"
            )}
            loading="lazy"
            decoding="async"
          />
          {photo.status && (
            <div className="absolute inset-0 flex items-center justify-center">
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isFirst ? "default" : "secondary"} className="text-xs">
              {isFirst ? "📷 Principale" : `Photo ${index + 1}`}
            </Badge>
            {photo.status && (
              <Badge 
                variant={photo.status === "error" || photo.status === "invalid" ? "destructive" : "outline"} 
                className="text-xs"
              >
                {photo.status === "uploading" && "Envoi..."}
                {photo.status === "success" && "✓ OK"}
                {photo.status === "error" && "Erreur"}
                {photo.status === "invalid" && "Invalide"}
              </Badge>
            )}
          </div>
          
          {photo.error && (
            <p className="text-xs text-destructive mb-2 line-clamp-2" title={photo.error}>
              {photo.error}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {photo.status === "error" && onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRetry(index)}
                className="h-7 px-2 text-xs"
                title="Réessayer"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {onMoveUp && index > 0 && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMoveUp(index)}
                className="h-7 px-2 text-xs"
                title="Déplacer vers le haut"
                disabled={isUploading}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
            )}
            {onMoveDown && index < totalCount - 1 && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMoveDown(index)}
                className="h-7 px-2 text-xs"
                title="Déplacer vers le bas"
                disabled={isUploading}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-7 px-2 text-xs"
              title="Supprimer"
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhotoManagerProps {
  photos: PhotoItem[];
  onReorder: (newOrder: PhotoItem[]) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRetry?: (index: number) => void;
}

export function PhotoManager({
  photos,
  onReorder,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRetry,
}: PhotoManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement requis avant d'activer le drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((_, i) => `photo-${i}` === active.id);
      const newIndex = photos.findIndex((_, i) => `photo-${i}` === over.id);

      // Vérifier qu'aucune image n'est en cours d'upload
      if (photos.some(p => p.status === "uploading")) {
        toast({
          title: "Upload en cours",
          description: "Attendez la fin de l'upload avant de réorganiser",
          variant: "destructive",
        });
        return;
      }

      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      onReorder(newPhotos);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Créer des IDs uniques pour chaque photo
  const photoIds = photos.map((_, index) => `photo-${index}`);

  if (photos.length === 0) {
    return null;
  }

  const uploadingCount = photos.filter(p => p.status === "uploading").length;
  const errorCount = photos.filter(p => p.status === "error" || p.status === "invalid").length;
  const successCount = photos.filter(p => p.status === "success").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          <span>Glissez-déposez pour réorganiser • {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
        </div>
        {(uploadingCount > 0 || errorCount > 0 || successCount > 0) && (
          <div className="flex items-center gap-2 text-xs">
            {uploadingCount > 0 && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {uploadingCount} envoi{uploadingCount > 1 ? 's' : ''}
              </Badge>
            )}
            {successCount > 0 && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {successCount} OK
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errorCount} erreur{errorCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={photoIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <SortablePhotoItem
                key={photoIds[index]}
                id={photoIds[index]}
                photo={photo}
                index={index}
                isFirst={index === 0}
                totalCount={photos.length}
                onRemove={onRemove}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onRetry={onRetry}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-muted-foreground italic">
        💡 Astuce : La première photo sera affichée comme image principale sur votre annonce
      </p>
    </div>
  );
}
