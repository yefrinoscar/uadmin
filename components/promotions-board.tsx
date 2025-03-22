"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { mockPromotions } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { PromotionCard } from "@/components/promotion-card"
import { PromotionFormDialog } from "@/components/promotion-form-dialog"
import { Search } from "lucide-react"
import { Promotion } from "@/types/promotion"
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { useSupabaseClient } from "@/lib/supabase-client"

interface PromotionsBoardProps {
  initialPromotions?: Promotion[]
  useMockData?: boolean
}

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DroppableContainer({ id, children, className }: DroppableContainerProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id });
  const isActiveContainer = active?.data?.current?.sortable?.containerId === id;

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        className,
        "transition-all duration-200",
        isOver && !isActiveContainer && "ring-2 ring-primary scale-[1.02]",
        isActiveContainer && "opacity-50"
      )}
    >
      <SortableContext items={[]} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function SortableItem({ id, children, disabled = false }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function PromotionsBoard({ initialPromotions}: PromotionsBoardProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions || [])
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [inactivePromotions, setInactivePromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [draggedPromotion, setDraggedPromotion] = useState<Promotion | null>(null)
  const [replacingPromotion, setReplacingPromotion] = useState<string | null>(null)
  const [inactiveSearchTerm, setInactiveSearchTerm] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Function to get authenticated client
  const { getAuthenticatedClient } = useSupabaseClient();

  // Split promotions into active and inactive
  useEffect(() => {
    if (promotions.length > 0) {
      const active = promotions.filter(p => p.active);
      const inactive = promotions.filter(p => !p.active);

      setActivePromotions(active);
      setInactivePromotions(inactive);
    }
  }, [promotions])

  // Fetch promotions from API or use mock data
  const fetchPromotions = async () => {
    setIsLoading(true)
    try {
      setPromotions(mockPromotions)
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast.error("Error al cargar promociones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [getAuthenticatedClient])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const promotion = [...activePromotions, ...inactivePromotions].find(
      (p) => p.id === event.active.id
    );
    if (promotion) {
      setDraggedPromotion(promotion);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const isFromInactive = inactivePromotions.find((p) => p.id === active.id);
    const isFromActive = activePromotions.find((p) => p.id === active.id);
    const isOverActive = activePromotions.find((p) => p.id === over.id);
    const isOverActiveContainer = over.id === "active";
    const isOverInactiveContainer = over.id === "inactive";

    // Show replacing indicator when:
    // 1. Dragging from inactive to active promotion (replace)
    // 2. Dragging from inactive to active container (add, if space available)
    // 3. Dragging from active to inactive (deactivate)
    if (
      (isFromInactive && (isOverActive || (isOverActiveContainer && activePromotions.length < 2))) ||
      (isFromActive && (isOverInactiveContainer || isOverActive))
    ) {
      setReplacingPromotion(isOverActive ? over.id as string : null);
    } else {
      setReplacingPromotion(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedPromotion(null);
    setReplacingPromotion(null);

    if (!over) return;

    const isFromInactive = inactivePromotions.find((p) => p.id === active.id);
    const isFromActive = activePromotions.find((p) => p.id === active.id);
    const isOverActive = activePromotions.find((p) => p.id === over.id);
    const isOverActiveContainer = over.id === "active";
    const isOverInactiveContainer = over.id === "inactive";

    if (isFromInactive) {
      if (isOverActive) {
        // Replace active promotion with inactive promotion
        const updatedActive = activePromotions.map((p) =>
          p.id === over.id ? { ...isFromInactive, active: true } : p
        );
        const updatedInactive = [
          ...inactivePromotions.filter((p) => p.id !== active.id),
          { ...isOverActive, active: false },
        ];

        const newPromotions = [...updatedActive, ...updatedInactive];
        setPromotions(newPromotions);
        setHasChanges(true);
        toast.success("Promoción reemplazada exitosamente");
      } else if (isOverActiveContainer && activePromotions.length < 2) {
        // Add inactive promotion to active container
        const draggedPromotion = inactivePromotions.find((p) => p.id === active.id);
        if (!draggedPromotion) return;

        const updatedActive = [...activePromotions, { ...draggedPromotion, active: true }];
        const updatedInactive = inactivePromotions.filter((p) => p.id !== active.id);

        const newPromotions = [...updatedActive, ...updatedInactive];
        setPromotions(newPromotions);
        setHasChanges(true);
        toast.success("Promoción activada exitosamente");
      }
    } else if (isFromActive) {
      if (isOverInactiveContainer || isOverActive) {
        // Move active promotion to inactive
        const updatedActive = activePromotions.filter((p) => p.id !== active.id);
        const updatedInactive = [
          ...inactivePromotions,
          { ...isFromActive, active: false },
        ];

        const newPromotions = [...updatedActive, ...updatedInactive];
        setPromotions(newPromotions);
        setHasChanges(true);
        toast.success("Promoción desactivada exitosamente");
      }
    }
  };

  // Delete promotion
  const handleDeletePromotion = async (promotion: Promotion) => {
    if (confirm(`¿Estás seguro que deseas eliminar la promoción "${promotion.name}"?`)) {
      setIsPending(true)
      try {
        setPromotions(prevPromotions => prevPromotions.filter(p => p.id !== promotion.id))
        toast.success("Promoción eliminada correctamente")
      } catch (error) {
        console.error("Error deleting promotion:", error)
        toast.error("Error al eliminar la promoción")
      } finally {
        setIsPending(false)
      }
    }
  }

  // Handle editing a promotion
  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsDialogOpen(true)
  }

  // Handle creating a promotion
  const handleCreatePromotion = async (promotion: Promotion) => {
    setIsPending(true)
    try {
      const newPromotion: Promotion = {
        ...promotion,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (editingPromotion) {
        setPromotions(prevPromotions =>
          prevPromotions.map(p =>
            p.id === editingPromotion.id
              ? { ...newPromotion, id: editingPromotion.id }
              : p
          )
        )
        toast.success("Promoción actualizada correctamente")
      } else {
        setPromotions(prevPromotions => [newPromotion, ...prevPromotions])
        toast.success("Promoción creada correctamente")
      }
    } catch (error) {
      console.error("Error saving promotion:", error)
      toast.error("Error al guardar la promoción")
    } finally {
      setIsPending(false)
    }
  }

  const filteredInactivePromotions = inactivePromotions.filter(
    p => p.name.toLowerCase().includes(inactiveSearchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(inactiveSearchTerm.toLowerCase())
  )

  // Custom drop animation
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  // Update renderPromotionCard to disable dragging for expired promotions
  const renderPromotionCard = (promotion: Promotion, index: number, isDraggingDisabled: boolean = false) => {
    const endDate = new Date(promotion.end_date)
    const isExpired = endDate < new Date()

    return (
      <SortableItem 
        key={promotion.id} 
        id={promotion.id}
        disabled={isDraggingDisabled || isPending || isExpired}
      >
        <div className={cn(
          "transition-transform duration-200",
          isDraggingDisabled ? "opacity-50" : ""
        )}>
          <PromotionCard
            promotion={promotion}
            onEdit={handleEditPromotion}
            onDelete={handleDeletePromotion}
            onSetMain={handleSetMainPromotion}
            isPending={isPending}
            isReplacing={promotion.id === replacingPromotion}
            isActive={promotion.active}
            isOver={promotion.id === replacingPromotion}
          />
        </div>
      </SortableItem>
    )
  }

  // Add this function to handle publishing changes
  const handlePublishChanges = () => {
    setIsPending(true)
    try {
      // Here you would typically make an API call
      // For now, we'll just show a success message
      toast.success("Cambios publicados correctamente")
      setHasChanges(false)
    } catch (error) {
      console.log(error);
      
      toast.error("Error al publicar los cambios")
    } finally {
      setIsPending(false)
    }
  }

  // Add this function to handle setting main promotion
  const handleSetMainPromotion = (promotion: Promotion) => {
    if (!promotion.active) {
      toast.error("Solo las promociones activas pueden ser principales")
      return
    }

    setPromotions(prevPromotions => 
      prevPromotions.map(p => ({
        ...p,
        isMain: p.id === promotion.id
      }))
    )
    setHasChanges(true)
    toast.success("Promoción principal actualizada")
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando promociones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-4">
        {hasChanges && (
          <Button 
            onClick={handlePublishChanges} 
            disabled={isPending}
            className="bg-underla hover:bg-underla-600 text-white border-none"
          >
            Publicar Cambios
          </Button>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Promoción
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <PromotionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreatePromotion}
        editingPromotion={editingPromotion}
        activePromotionsCount={activePromotions.length}
      />

      <div className="flex flex-col md:flex-row gap-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[]}
        >
          <div className="w-full md:w-1/3">
            <div className="bg-secondary/20 p-4 rounded-lg">
              <h2 className="font-semibold text-lg mb-4">
                Promociones Activas
                <span className="ml-2">{activePromotions.length}/2</span>
              </h2>
              
              <DroppableContainer 
                id="active"
                className={cn(
                  "min-h-[200px] transition-all duration-200 space-y-6",
                  activePromotions.length === 0 ? "flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg" : ""
                )}
              >
                {activePromotions.length > 0 ? (
                  activePromotions.map((promotion, index) => 
                    renderPromotionCard(promotion, index)
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Arrastra promociones aquí para activarlas</p>
                    <p className="text-xs mt-1">
                      Máximo 2 promociones activas
                    </p>
                  </div>
                )}
              </DroppableContainer>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="bg-background border p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Promociones Inactivas</h2>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar promociones..."
                    className="w-full rounded-md border border-input pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={inactiveSearchTerm}
                    onChange={(e) => setInactiveSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <DroppableContainer 
                id="inactive"
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6",
                  "min-h-[200px] transition-all duration-200",
                  inactivePromotions.length === 0 ? "!grid-cols-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg" : ""
                )}
              >
                {filteredInactivePromotions.length > 0 ? (
                  filteredInactivePromotions.map((promotion, index) => 
                    renderPromotionCard(promotion, index)
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8 col-span-2">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay promociones inactivas</p>
                  </div>
                )}
              </DroppableContainer>
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {draggedPromotion && (
              <div className="w-full transform-gpu">
                <PromotionCard
                  promotion={draggedPromotion}
                  onEdit={handleEditPromotion}
                  onDelete={handleDeletePromotion}
                  onSetMain={handleSetMainPromotion}
                  isPending={isPending}
                  isReplacing={false}
                  isActive={draggedPromotion.active}
                  isOver={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
