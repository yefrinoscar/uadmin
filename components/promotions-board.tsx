"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
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
import { promotionsService } from '@/lib/services/promotions'
import { useSupabaseClient } from '@/lib/supabase-client'

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
  const [draggedPromotion, setDraggedPromotion] = useState<Promotion | null>(null)
  const [replacingPromotion, setReplacingPromotion] = useState<string | null>(null)
  const [inactiveSearchTerm, setInactiveSearchTerm] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPromotions, setOriginalPromotions] = useState<Promotion[]>([])
  const { getAuthenticatedClient } = useSupabaseClient()

  // Track original active promotions
  const [originalActivePromotions, setOriginalActivePromotions] = useState<Promotion[]>([])

  // Split promotions into active and inactive
  useEffect(() => {
    if (promotions.length > 0) {
      const now = new Date()
      const active = promotions.filter(p => {
        const startDate = new Date(p.start_date)
        const endDate = new Date(p.end_date)
        return p.active && startDate <= now && endDate > now
      });
      const inactive = promotions.filter(p => {
        const startDate = new Date(p.start_date)
        const endDate = new Date(p.end_date)
        return !p.active || startDate > now || endDate <= now
      });

      setActivePromotions(active);
      setInactivePromotions(inactive);

      // Check if active promotions have changed
      const activeChanged = active.length !== originalActivePromotions.length ||
        active.some((p, i) => {
          const original = originalActivePromotions[i]
          return !original || 
            p.id !== original.id || 
            p.active !== original.active ||
            p.is_main !== original.is_main
        })

      setHasChanges(activeChanged)
    }
  }, [promotions, originalActivePromotions])

  // Initialize original active promotions
  useEffect(() => {
    if (initialPromotions && initialPromotions.length > 0) {
      const now = new Date()
      const active = initialPromotions.filter(p => {
        const startDate = new Date(p.start_date)
        const endDate = new Date(p.end_date)
        return p.active && startDate <= now && endDate > now
      });
      setOriginalActivePromotions(active)
    }
  }, [initialPromotions])

  // Fetch promotions from API
  const fetchPromotions = async () => {
    setIsLoading(true)
    try {
      const supabase = await getAuthenticatedClient()
      const promotionsData = await promotionsService.getAll(supabase)
      setPromotions(promotionsData)
      setOriginalPromotions(promotionsData)
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast.error("Error al cargar promociones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

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

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedPromotion(null)
    setReplacingPromotion(null)

    if (!event.over) return

    const draggedId = event.active.id as string
    const overId = event.over.id as string
    
    if (draggedId === overId) return

    const draggedPromotion = promotions.find(p => p.id === draggedId)
    if (!draggedPromotion) return

    // Check if the promotion can be activated
    const now = new Date()
    const startDate = new Date(draggedPromotion.start_date)
    const endDate = new Date(draggedPromotion.end_date)
    const canBeActive = startDate <= now && endDate > now

    // Moving to active column
    if (overId === 'active') {
      if (!canBeActive) {
        toast.error("No se puede activar una promoción expirada o pendiente")
        return
      }

      if (activePromotions.length >= 2) {
        toast.error("No se pueden tener más de 2 promociones activas")
        return
      }

      // Update the promotion to be active
      setPromotions(prevPromotions =>
        prevPromotions.map(p =>
          p.id === draggedId
            ? { ...p, active: true }
            : p
        )
      )
      setHasChanges(true)
      toast.success("Promoción activada exitosamente")
    }
    
    // Moving to inactive column
    else if (overId === 'inactive') {
      // If it's a main promotion, prevent deactivation
      if (draggedPromotion.is_main) {
        toast.error("No se puede desactivar una promoción principal")
        return
      }

      // Update the promotion to be inactive
      setPromotions(prevPromotions =>
        prevPromotions.map(p =>
          p.id === draggedId
            ? { ...p, active: false }
            : p
        )
      )
      setHasChanges(true)
      toast.success("Promoción desactivada exitosamente")
    }

    // Replacing one promotion with another
    else {
      const overPromotion = promotions.find(p => p.id === overId)
      if (!overPromotion) return

      // Update both promotions
      setPromotions(prevPromotions =>
        prevPromotions.map(p => {
          if (p.id === draggedId) {
            return { ...p, active: overPromotion.active }
          }
          if (p.id === overId) {
            return { ...p, active: draggedPromotion.active }
          }
          return p
        })
      )
      setHasChanges(true)
      toast.success("Promociones intercambiadas exitosamente")
    }
  };

  // Handle deleting a promotion
  const handleDeletePromotion = async (promotion: Promotion) => {
    if (confirm(`¿Estás seguro que deseas eliminar la promoción "${promotion.name}"?`)) {
      setIsPending(true)
      try {
        const supabase = await getAuthenticatedClient()
        await promotionsService.delete(supabase, promotion.id)
        setPromotions(prev => prev.filter(p => p.id !== promotion.id))
        toast.success("Promoción eliminada correctamente")
        setHasChanges(true)
      } catch (error) {
        console.error("Error deleting promotion:", error)
        toast.error("Error al eliminar la promoción")
      } finally {
        setIsPending(false)
      }
    }
  }

  // Handle editing a promotion
  const handleEditPromotion = async (promotion: Promotion) => {
    setIsPending(true)
    try {
      const supabase = await getAuthenticatedClient()
      const updatedPromotion = await promotionsService.update(supabase, promotion.id, promotion)
      setPromotions(prev => prev.map(p => p.id === updatedPromotion.id ? updatedPromotion : p))
      toast.success("Promoción actualizada correctamente")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error updating promotion:", error)
      toast.error("Error al actualizar la promoción")
    } finally {
      setIsPending(false)
    }
  }

  // Handle creating a promotion
  const handleCreatePromotion = async (promotion: Promotion) => {
    setIsPending(true)
    try {
      const supabase = await getAuthenticatedClient()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...promotionWithoutId } = promotion
      const createdPromotion = await promotionsService.create(supabase, promotionWithoutId)
      setPromotions(prev => [...prev, createdPromotion])
      toast.success("Promoción creada correctamente")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating promotion:", error)
      toast.error("Error al crear la promoción")
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
            onDuplicate={handleDuplicate}
            showDuplicate={!promotion.active}
          />
        </div>
      </SortableItem>
    )
  }

  // Handle publishing changes
  const handlePublishChanges = async () => {
    setIsPending(true)
    try {
      const supabase = await getAuthenticatedClient()
      await promotionsService.bulkUpdate(supabase, promotions)
      
      // Update original active promotions
      const now = new Date()
      const active = promotions.filter(p => {
        const startDate = new Date(p.start_date)
        const endDate = new Date(p.end_date)
        return p.active && startDate <= now && endDate > now
      });
      setOriginalActivePromotions(active)
      
      setHasChanges(false)
      toast.success("Cambios publicados correctamente")
    } catch (error) {
      console.error("Error publishing changes:", error)
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
        is_main: p.id === promotion.id
      }))
    )
    setHasChanges(true)
    toast.success("Promoción principal actualizada")
  }

  // Add this function to handle duplication
  const handleDuplicate = (promotion: Promotion) => {
    const now = new Date()
    const duplicatedPromotion: Promotion = {
      ...promotion,
      id: `mock-${Date.now()}`,
      name: `${promotion.name} (Copia)`,
      active: false,
      is_main: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    setPromotions(prev => [duplicatedPromotion, ...prev])
    setHasChanges(true)
    toast.success("Promoción duplicada correctamente")
  }

  // Add the revert changes handler
  const handleRevertChanges = () => {
    if (confirm("¿Estás seguro que deseas descartar todos los cambios?")) {
      setPromotions(originalPromotions)
      setHasChanges(false)
      toast.success("Cambios descartados")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando promociones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-4">
        {hasChanges && (
          <>
            <Button 
              variant="outline"
              onClick={handleRevertChanges} 
              disabled={isPending}
            >
              Descartar Cambios
            </Button>
            <Button 
              onClick={handlePublishChanges} 
              disabled={isPending}
              className="bg-underla bg-underla-500 hover:bg-underla-700 text-white border-none"
            >
              Publicar Cambios
            </Button>
          </>
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
        activePromotionsCount={activePromotions.length}
        editingPromotion={null}
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
                  onDuplicate={handleDuplicate}
                  showDuplicate={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
