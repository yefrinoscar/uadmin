"use client"

import { useEffect, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PromotionCard } from "./promotion-card"
import { PromotionFormDialog } from "@/app/(dashboard)/dashboard/promotions/_components/promotion-form-dialog"
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
  MeasuringStrategy,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { api } from '@/app/providers'
import { usePromotionsStore } from './store/promotions-store'

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

// Memoize the DroppableContainer component to prevent unnecessary re-renders
const DroppableContainer = memo(function DroppableContainer({ id, children, className }: DroppableContainerProps) {
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
});

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// Memoize the SortableItem component
const SortableItem = memo(function SortableItem({ id, children, disabled = false }: DraggableItemProps) {
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
    pointerEvents: disabled ? 'none' as const : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
});

export function PromotionsBoard() {
  // tRPC queries/mutations
  const utils = api.useUtils()
  const [fetchedPromotions] = api.promotions.getAll.useSuspenseQuery({ ascending: true });

  const createPromotionMutation = api.promotions.create.useMutation({
    onSuccess: () => utils.promotions.getAll.invalidate()
  });

  const updatePromotionMutation = api.promotions.update.useMutation({
    onSuccess: () => utils.promotions.getAll.invalidate()
  });

  const deletePromotionMutation = api.promotions.delete.useMutation({
    onSuccess: () => utils.promotions.getAll.invalidate()
  });

  const bulkUpdateStatusMutation = api.promotions.bulkUpdateStatus.useMutation({
    onSuccess: () => utils.promotions.getAll.invalidate()
  });

  // Get state and actions from Zustand store
  const {
    // State
    promotions,
    isDialogOpen,
    isPending,
    searchTerm,
    draggedPromotion,
    currentPromotion,
    replacingId,

    // Computed values
    getActivePromotions,
    getFilteredInactivePromotions,
    hasChanges,

    // Actions
    setPromotions,
    initializeStore,
    resetChanges,
    setCurrentPromotion,
    setDialogOpen,
    setPending,
    setSearchTerm,
    setDraggedPromotion,
    setReplacingId,
    toggleActive,
    setAsMain,
    updatePromotion,
    removePromotion,
    addPromotion,
    duplicatePromotion,
  } = usePromotionsStore();

  // Calculate derived values
  const activePromotions = getActivePromotions();
  const filteredInactivePromotions = getFilteredInactivePromotions();
  const hasUnsavedChanges = hasChanges();

  // Initialize store with fetched data
  useEffect(() => {
    if (!fetchedPromotions?.length) return;

    if (promotions.length === 0) {
      // First load: initialize with deep copy
      initializeStore(fetchedPromotions);
    } else {
      // Subsequent loads: just update the promotions array
      setPromotions(fetchedPromotions);
    }
  }, [fetchedPromotions, promotions.length, initializeStore, setPromotions]);

  // Call useSensor at the top level
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });

  // Pass the sensor instance to useSensors
  const sensors = useSensors(pointerSensor);

  // Memoize handlers to prevent recreating functions on each render
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const promotion = promotions.find(p => p.id === id);
    if (promotion) {
      setDraggedPromotion(promotion);
    }
  }, [promotions, setDraggedPromotion]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedPromotion = promotions.find(p => p.id === activeId);
    if (!draggedPromotion) return;

    const isFromInactive = !draggedPromotion.active;
    const isFromActive = draggedPromotion.active;

    // Check if dragging over a promotion or a container
    const isOverPromotion = promotions.some(p => p.id === overId);
    const isOverActiveContainer = overId === "active";
    const isOverInactiveContainer = overId === "inactive";

    // Show replacing indicator for valid drop targets - only if needed
    if (
      (isFromInactive && (isOverPromotion || (isOverActiveContainer && activePromotions.length < 2))) ||
      (isFromActive && (isOverInactiveContainer || (isOverPromotion && promotions.find(p => p.id === overId)?.active)))
    ) {
      // Only set replacingId if it's different from the current one to avoid re-renders
      if (replacingId !== (isOverPromotion ? overId : null)) {
        setReplacingId(isOverPromotion ? overId : null);
      }
    } else if (replacingId !== null) {
      // Only update if needed
      setReplacingId(null);
    }
  }, [promotions, replacingId, activePromotions.length, setReplacingId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedPromotion(null);
    setReplacingId(null);

    if (!event.over) return;

    const draggedId = event.active.id as string;
    const overId = event.over.id as string;

    if (draggedId === overId) return;

    const draggedPromotion = promotions.find(p => p.id === draggedId);
    if (!draggedPromotion) return;

    // Check if the promotion can be activated
    const now = new Date();
    const startDate = new Date(draggedPromotion.start_date);
    const endDate = new Date(draggedPromotion.end_date);
    const canBeActive = startDate <= now && endDate > now;

    // Moving to active column
    if (overId === 'active') {
      if (!canBeActive) {
        toast.error("No se puede activar una promoción expirada o pendiente");
        return;
      }

      if (activePromotions.length >= 2) {
        toast.error("No se pueden tener más de 2 promociones activas");
        return;
      }

      // Update the promotion to be active
      toggleActive(draggedId, true);
      toast.success("Promoción activada exitosamente");
      return;
    }

    // Moving to inactive column
    if (overId === 'inactive') {
      // If it's a main promotion, prevent deactivation
      if (draggedPromotion.is_main) {
        toast.error("No se puede desactivar una promoción principal");
        return;
      }

      // Update the promotion to be inactive
      toggleActive(draggedId, false);
      toast.success("Promoción desactivada exitosamente");
      return;
    }

    // Handle replacement (dragging to another promotion)
    const targetPromotion = promotions.find(p => p.id === overId);
    if (targetPromotion) {
      // If trying to replace main promotion, prevent it
      if (targetPromotion.is_main && !draggedPromotion.active) {
        toast.error("No se puede reemplazar una promoción principal");
        return;
      }

      // If the target is active and we're coming from inactive and promotion can be active
      if (targetPromotion.active && !draggedPromotion.active && canBeActive) {
        // Make dragged active and target inactive
        toggleActive(draggedId, true);
        toggleActive(overId, false);
        toast.success("Promociones intercambiadas exitosamente");
        return;
      }

      // If both are active, just acknowledge it (reordering not implemented yet)
      if (targetPromotion.active && draggedPromotion.active) {
        toast.info("Orden de promociones no implementado aún");
        return;
      }
    }
  }, [promotions, activePromotions.length, toggleActive, setDraggedPromotion, setReplacingId]);

  // Stabilize handleDeletePromotion with useCallback
  const handleDeletePromotion = useCallback(async (promotion: Promotion) => {
    if (confirm(`¿Estás seguro que deseas eliminar la promoción "${promotion.name}"?`)) {
      setPending(true);
      try {
        await deletePromotionMutation.mutateAsync(promotion.id);
        removePromotion(promotion.id);
        toast.success("Promoción eliminada correctamente");
      } catch (error) {
        console.error("Error deleting promotion:", error);
        toast.error("Error al eliminar la promoción");
      } finally {
        setPending(false);
      }
    }
  }, [deletePromotionMutation, removePromotion, setPending]);

  // Stabilize handleSetMainPromotion with useCallback
  const handleSetMainPromotion = useCallback((promotion: Promotion) => {
    if (!promotion.active) {
      toast.error("Solo las promociones activas pueden ser principales");
      return;
    }

    setAsMain(promotion.id);
    toast.success("Promoción principal actualizada");
  }, [setAsMain]);

  // Update renderPromotionCard dependencies to include the stabilized handlers
  const renderPromotionCard = useCallback((promotion: Promotion) => {
    const endDate = new Date(promotion.end_date);
    const isExpired = endDate < new Date();

    return (
      <SortableItem
        key={promotion.id}
        id={promotion.id}
        disabled={isPending || isExpired}
      >
        <PromotionCard
          promotion={promotion}
          onEdit={(p) => {
            setCurrentPromotion(p);
            setDialogOpen(true);
          }}
          onDelete={handleDeletePromotion}
          onSetMain={handleSetMainPromotion}
          isPending={isPending}
          isReplacing={promotion.id === replacingId}
          isActive={promotion.active}
          isOver={promotion.id === replacingId}
          onDuplicate={duplicatePromotion}
          showDuplicate={!promotion.active}
        />
      </SortableItem>
    );
  }, [
    isPending,
    replacingId,
    setCurrentPromotion,
    setDialogOpen,
    handleDeletePromotion,
    handleSetMainPromotion,
    duplicatePromotion
  ]);

  // Memoize the active promotions list
  const activePromotionsList = useMemo(() => (
    activePromotions.length > 0 ? (
      activePromotions.map(promotion => renderPromotionCard(promotion))
    ) : (
      <div className="text-center text-muted-foreground py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-primary/50" />
        <p>Arrastra promociones aquí para activarlas</p>
        <p className="text-xs mt-1">Máximo 2 promociones activas</p>
      </div>
    )
  ), [activePromotions, renderPromotionCard]);

  // Memoize the inactive promotions list
  const inactivePromotionsList = useMemo(() => (
    filteredInactivePromotions.length > 0 ? (
      filteredInactivePromotions.map(promotion => renderPromotionCard(promotion))
    ) : (
      <div className="text-center text-muted-foreground py-8 col-span-2">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>No hay promociones inactivas</p>
      </div>
    )
  ), [filteredInactivePromotions, renderPromotionCard]);

  // Custom drop animation - memoized
  const dropAnimation = useMemo(() => ({
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  }), []);

  // Stabilize handleEditPromotion with useCallback
  const handleEditPromotion = useCallback(async (promotion: Promotion) => {
    setPending(true);
    try {
      const updatedPromotion = await updatePromotionMutation.mutateAsync({
        id: promotion.id,
        promotion
      });
      updatePromotion(updatedPromotion);
      toast.success("Promoción actualizada correctamente");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating promotion:", error);
      toast.error("Error al actualizar la promoción");
    } finally {
      setPending(false);
    }
  }, [updatePromotionMutation, updatePromotion, setPending, setDialogOpen]);

  // Stabilize handleCreatePromotion with useCallback
  const handleCreatePromotion = useCallback(async (promotion: Promotion) => {
    setPending(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...promotionWithoutId } = promotion;
      const createdPromotion = await createPromotionMutation.mutateAsync(promotionWithoutId);
      addPromotion(createdPromotion);
      toast.success("Promoción creada correctamente");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating promotion:", error);
      toast.error("Error al crear la promoción");
    } finally {
      setPending(false);
    }
  }, [createPromotionMutation, addPromotion, setPending, setDialogOpen]);

  // Stabilize handlePublishChanges with useCallback
  const handlePublishChanges = useCallback(async () => {
    setPending(true);
    try {
      // Only update active and is_main status
      const updatedPromotions = promotions.map(promotion => ({
        id: promotion.id,
        active: promotion.active,
        is_main: promotion.is_main
      }));

      await bulkUpdateStatusMutation.mutateAsync(updatedPromotions);
      initializeStore([...promotions]);
      toast.success("Cambios publicados correctamente");
    } catch (error) {
      console.error("Error publishing changes:", error);
      toast.error("Error al publicar los cambios");
    } finally {
      setPending(false);
    }
  }, [promotions, bulkUpdateStatusMutation, initializeStore, setPending]);

  return (
    <div className="space-y-6">
      {/* Fixed header with actions */}
      <div className="sticky top-0 z-20 pt-4 pb-4 border-b mb-4 shadow-sm backdrop-blur-[2px] bg-background/90">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">Gestión de Promociones</h2>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  Hay cambios sin publicar
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("¿Estás seguro que deseas descartar todos los cambios?")) {
                      resetChanges();
                      toast.success("Cambios descartados");
                    }
                  }}
                  disabled={isPending}
                  size="sm"
                >
                  Descartar
                </Button>
                <Button
                  onClick={handlePublishChanges}
                  disabled={isPending}
                  className="bg-underla bg-underla-500 hover:bg-underla-700 text-white border-none"
                  size="sm"
                >
                  Publicar
                </Button>
              </>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isPending} onClick={() => setCurrentPromotion(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Promoción
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      <PromotionFormDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={currentPromotion ? handleEditPromotion : handleCreatePromotion}
        activePromotionsCount={activePromotions.length}
        editingPromotion={currentPromotion}
      />

      <div className="flex flex-col md:flex-row gap-6 relative">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always
            }
          }}
        >
          {/* Active Promotions Column - Fixed while scrolling, adjust top position to account for header */}
          <div className="w-full md:w-1/3 md:sticky md:top-24 md:self-start transition-[top] duration-300">
            <div
              className="p-4 rounded-lg relative overflow-hidden transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundImage: 'url("/images/promotions-bg.png")',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Semi-transparent overlay for better contrast */}
              <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]"></div>

              {/* Content positioned above the background */}
              <div className="relative z-10">
                <h2 className="font-semibold text-lg mb-4 flex items-center">
                  {/* <span className="mr-2 p-1 rounded-full bg-primary/10 text-primary">
                    <AlertTriangle className="w-4 h-4" />
                  </span> */}
                  Promociones publicadas
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {activePromotions.length}/2
                  </span>
                </h2>

                <DroppableContainer
                  id="active"
                  className={cn(
                    "min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto pr-2",
                    "transition-all duration-200 space-y-6",
                    "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30",
                    activePromotions.length === 0 ? "flex items-center justify-center border-2 border-dashed border-primary/20 rounded-lg bg-primary/5" : ""
                  )}
                >
                  {activePromotionsList}
                </DroppableContainer>
              </div>
            </div>
          </div>

          {/* Inactive Promotions Column */}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <DroppableContainer
                id="inactive"
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6",
                  "min-h-[200px] transition-all duration-200",
                  filteredInactivePromotions.length === 0 ? "!grid-cols-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg" : ""
                )}
              >
                {inactivePromotionsList}
              </DroppableContainer>
            </div>
          </div>

          {/* Drag Overlay - using transform-gpu for hardware acceleration */}
          <DragOverlay dropAnimation={dropAnimation}>
            {draggedPromotion && (
              <div className="w-full transform-gpu will-change-transform">
                <PromotionCard
                  promotion={draggedPromotion}
                  onEdit={(p) => {
                    setCurrentPromotion(p);
                    setDialogOpen(true);
                  }}
                  onDelete={handleDeletePromotion}
                  onSetMain={handleSetMainPromotion}
                  isPending={isPending}
                  isReplacing={false}
                  isActive={draggedPromotion.active}
                  isOver={false}
                  onDuplicate={duplicatePromotion}
                  showDuplicate={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
} 