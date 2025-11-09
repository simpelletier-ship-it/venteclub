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
import { GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortablePhotoItemProps {
  id: string;
  url: string;
  index: number;
  isFirst: boolean;
  totalCount: number;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

function SortablePhotoItem({
  id,
  url,
  index,
  isFirst,
  totalCount,
  onRemove,
  onMoveUp,
  onMoveDown,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group border border-border rounded-lg p-2 bg-card transition-all",
        isDragging && "opacity-50 z-50 shadow-lg scale-105"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1 touch-none"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>

        {/* Photo */}
          <img
            src={url}
            alt={`Photo ${index + 1}`}
            className="w-24 h-24 object-cover rounded-md flex-shrink-0 pointer-events-none"
            loading="lazy"
            decoding="async"
          />

        {/* Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isFirst ? "default" : "secondary"} className="text-xs">
              {isFirst ? "📷 Principale" : `Photo ${index + 1}`}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {onMoveUp && index > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMoveUp(index)}
                className="h-7 px-2 text-xs"
                title="Déplacer vers le haut"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
            )}
            {onMoveDown && index < totalCount - 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMoveDown(index)}
                className="h-7 px-2 text-xs"
                title="Déplacer vers le bas"
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
  photos: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function PhotoManager({
  photos,
  onReorder,
  onRemove,
  onMoveUp,
  onMoveDown,
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GripVertical className="w-4 h-4" />
        <span>Glissez-déposez pour réorganiser • {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
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
            {photos.map((url, index) => (
              <SortablePhotoItem
                key={photoIds[index]}
                id={photoIds[index]}
                url={url}
                index={index}
                isFirst={index === 0}
                totalCount={photos.length}
                onRemove={onRemove}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
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
