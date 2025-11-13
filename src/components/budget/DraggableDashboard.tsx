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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { VisibilityPreferences } from "./DashboardVisibilitySettings";

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
}

const DraggableWidget = ({ id, children }: DraggableWidgetProps) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
};

interface DraggableDashboardProps {
  preferences: VisibilityPreferences;
  onOrderChange: (newOrder: string[]) => void;
  children: Record<string, React.ReactNode>;
}

export const DraggableDashboard = ({
  preferences,
  onOrderChange,
  children,
}: DraggableDashboardProps) => {
  const [items, setItems] = useState(preferences.widgetOrder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onOrderChange(newOrder);
        return newOrder;
      });
    }
  };

  // Filter visible widgets based on preferences
  const visibleWidgets = items.filter((widgetId) => {
    switch (widgetId) {
      case 'expenseTrends':
        return preferences.showExpenseTrends;
      case 'expensesByCategory':
        return preferences.showExpensesByCategory;
      case 'netWorthGamification':
        return preferences.showNetWorthGamification;
      case 'quickNetWorthUpdate':
        return preferences.showQuickNetWorthUpdate;
      case 'reerCeli':
        return preferences.showReerCeli;
      case 'coachIA':
        return preferences.showCoachIA;
      case 'financialGoals':
        return preferences.showFinancialGoals;
      default:
        return false;
    }
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleWidgets} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {visibleWidgets.map((widgetId) => (
            <DraggableWidget key={widgetId} id={widgetId}>
              {children[widgetId]}
            </DraggableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
