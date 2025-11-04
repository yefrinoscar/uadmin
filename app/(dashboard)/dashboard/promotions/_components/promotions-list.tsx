"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { PromotionCard } from "./promotion-card"
import { PromotionFormDialog } from "./promotion-form-dialog"
import { useTRPC } from "@/trpc/client"
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { Promotion } from "@/lib/schemas/promotion"

// Utility function to check if promotion is within its active time period (regardless of enabled status)
function isPromotionCurrentlyActive(promotion: Promotion): boolean {
  const now = new Date()
  const startDate = new Date(promotion.start_date)
  
  // Check if current date is on or after start_date
  if (now < startDate) return false
  
  // Check end_date: must be on or before end_date, OR end_date must be NULL
  if (promotion.end_date !== null && promotion.end_date !== undefined) {
    const endDate = new Date(promotion.end_date)
    if (now > endDate) return false
  }
  
  return true
}

// Skeleton card component for empty state
function PromotionSkeleton({ index, section = "active" }: { index: number, section?: "active" | "other" }) {
  const activeMessages = [
    "Crea tu primera promoción y aparecerá aquí",
    "Las promociones live se mostrarán en esta sección",
    "Aprovecha para crear ofertas especiales"
  ]
  
  const otherMessages = [
    "Las promociones futuras aparecerán aquí",
    "Promociones expiradas se mostrarán en esta sección",
    "Gestiona el ciclo de vida de tus promociones"
  ]
  
  const messages = section === "active" ? activeMessages : otherMessages
  
      const bgGradient = section === "active" 
      ? "bg-gradient-to-br from-green-50/30 to-blue-50/30" 
      : "bg-gradient-to-br from-gray-50/30 to-slate-50/30"
    
    return (
      <Card className={`p-6 opacity-40 border-dashed border-2 hover:opacity-60 transition-opacity duration-200 ${bgGradient}`}>
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="w-20 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="w-10 h-5 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
        
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Dates skeleton */}
        <div className="p-3 bg-gray-100/50 rounded-lg space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1">
              <div className="w-8 h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="w-6 h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-32 h-2 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="p-2 bg-gray-100/30 rounded">
          <div className="w-24 h-2 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Call to action message */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground font-medium">
            {messages[index % messages.length]}
          </p>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between items-center">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  )
}

// Utility function to get promotion status
function getPromotionStatus(promotion: Promotion): 'active' | 'expired' | 'pending' | 'disabled' {
  const now = new Date()
  const startDate = new Date(promotion.start_date)

  if (!promotion.enabled) return 'disabled'
  if (now < startDate) return 'pending'
  
  // Check if expired (only if end_date exists)
  if (promotion.end_date !== null && promotion.end_date !== undefined) {
    const endDate = new Date(promotion.end_date)
    if (now > endDate) return 'expired'
  }
  
  return 'active'
}

export function PromotionsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Get all promotions
  const { data: promotions = [], refetch } = useSuspenseQuery(
    trpc.promotions.getAll.queryOptions({ ascending: false })
  )

  // Mutations
  const createPromotionMutation = useMutation(
    trpc.promotions.create.mutationOptions({
      onSuccess: () => {
        setIsDialogOpen(false)
        setEditingPromotion(null)

        refetch()
      },
      onError: (error) => {
        toast.error(`Error al crear la promoción: ${error.message}`)
      }
    })
  )

  const updatePromotionMutation = useMutation(
    trpc.promotions.update.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = [['promotions', 'getAll'], { input: { ascending: false }, type: 'query' }]
        await queryClient.cancelQueries({ queryKey })
        
        const previousPromotions = queryClient.getQueryData(queryKey) as Promotion[]
        
        if (previousPromotions) {
          const optimisticPromotions = previousPromotions.map(p =>
            p.id === variables.id ? { ...p, ...variables.promotion } : p
          )
          queryClient.setQueryData(queryKey, optimisticPromotions)
        }
        
        return { previousPromotions, queryKey }
      },
      onError: (error, variables, context) => {
        if (context?.previousPromotions && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousPromotions)
        }
        toast.error(`Error al actualizar la promoción: ${error.message}`)
      },
      onSuccess: () => {
        setIsDialogOpen(false)
        setEditingPromotion(null)
      },
      onSettled: () => {
        const queryKey = [['promotions', 'getAll'], { input: { ascending: false }, type: 'query' }]
        queryClient.invalidateQueries({ queryKey })
      }
    })
  )

  const deletePromotionMutation = useMutation(
    trpc.promotions.delete.mutationOptions({
      onMutate: async (deletedPromotionId) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        const queryKey = [['promotions', 'getAll'], { input: { ascending: false }, type: 'query' }]
        await queryClient.cancelQueries({ queryKey })

        // Snapshot the previous value
        const previousPromotions = queryClient.getQueryData(queryKey) as Promotion[]

        // Optimistically update to the new value
        if (previousPromotions) {
          queryClient.setQueryData(
            queryKey,
            previousPromotions.filter(promotion => promotion.id !== deletedPromotionId)
          )
        }

        // Return a context object with the snapshotted value
        return { previousPromotions, queryKey }
      },
      onError: (error, deletedPromotionId, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousPromotions && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousPromotions)
        }
        toast.error(`Error al eliminar la promoción: ${error.message}`)
      },
      onSuccess: () => {
        // Silent success - optimistic update already handled
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
        const queryKey = [['promotions', 'getAll'], { input: { ascending: false }, type: 'query' }]
        queryClient.invalidateQueries({ queryKey })
      }
    })
  )

  // Filter and categorize promotions
  const { currentlyActivePromotions, otherPromotions } = useMemo(() => {
    const filtered = promotions.filter(promotion =>
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const currentlyActive = filtered.filter(isPromotionCurrentlyActive)
    const others = filtered.filter(promotion => !isPromotionCurrentlyActive(promotion))

    // Sort others by status: pending -> disabled -> expired
    others.sort((a, b) => {
      const statusOrder = { pending: 0, disabled: 1, expired: 2, active: 3 }
      const statusA = getPromotionStatus(a)
      const statusB = getPromotionStatus(b)
      return statusOrder[statusA] - statusOrder[statusB]
    })

    return {
      currentlyActivePromotions: currentlyActive,
      otherPromotions: others
    }
  }, [promotions, searchTerm])

  // Handlers
  const handleCreatePromotion = async (promotion: Promotion) => {
    console.log(promotion);

    await createPromotionMutation.mutateAsync(promotion)
  }

  const handleUpdatePromotion = async (promotion: Promotion) => {
    console.log(promotion, 'promotion');
    await updatePromotionMutation.mutateAsync({
      id: promotion.id!,
      promotion: promotion
    })
  }

  const handleDeletePromotion = async (promotion: Promotion) => {
    setPromotionToDelete(promotion)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (promotionToDelete) {
      // Close dialog immediately for better UX
      setDeleteDialogOpen(false)
      const promotionId = promotionToDelete.id!
      setPromotionToDelete(null)
      
      // Then perform the deletion (optimistic update will handle UI)
      deletePromotionMutation.mutate(promotionId)
    }
  }

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsDialogOpen(true)
  }

  const handleDuplicatePromotion = async (promotion: Promotion) => {
    const duplicated: Promotion = {
      ...promotion,
      id: '',
      title: `${promotion.title} (Copia)`,
      active: false,
      enabled: false,
    }

    await createPromotionMutation.mutateAsync(duplicated)
  }

  const handleSetAsMain = async (promotion: Promotion) => {
    // First, unset any existing main promotion
    const currentMain = promotions.find(p => p.enabled && p.id !== promotion.id)
    if (currentMain) {
      const updatedCurrentMain = { ...currentMain, enabled: false }
      await updatePromotionMutation.mutateAsync({
        id: currentMain.id!,
        promotion: updatedCurrentMain
      })
    }

    // Then set this promotion as main
    const updatedPromotion = { ...promotion, enabled: true }
    await updatePromotionMutation.mutateAsync({
      id: promotion.id!,
      promotion: updatedPromotion
    })
  }

  const handleToggleEnabled = async (promotion: Promotion) => {
    // Get the current state from the query cache to avoid stale closures
    const queryKey = [['promotions', 'getAll'], { input: { ascending: false }, type: 'query' }]
    const currentPromotions = queryClient.getQueryData(queryKey) as Promotion[]
    
    if (!currentPromotions) return
    
    // Find the current promotion state (might have been updated by previous optimistic updates)
    const currentPromotion = currentPromotions.find(p => p.id === promotion.id)
    if (!currentPromotion) return
    
    const newEnabledStatus = !currentPromotion.enabled
    const updatedPromotion = { ...currentPromotion, enabled: newEnabledStatus }
    
    // Let the mutation handle optimistic updates
    updatePromotionMutation.mutate({
      id: promotion.id!,
      promotion: updatedPromotion
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Promociones</h1>
          <p className="text-muted-foreground">
            Gestiona las promociones de tu tienda
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPromotion(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Promoción
            </Button>
          </DialogTrigger>
          <PromotionFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
            editingPromotion={editingPromotion}
            activePromotionsCount={currentlyActivePromotions.length}
          />
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar promociones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Currently Active Promotions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">Promociones live</h2>
          <span className="text-sm text-muted-foreground">
            ({currentlyActivePromotions.length})
          </span>
          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentlyActivePromotions.length > 0 ? (
            currentlyActivePromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isActive={true}
                onEdit={handleEditPromotion}
                onDelete={handleDeletePromotion}
                onDuplicate={handleDuplicatePromotion}
                onToggleActive={handleToggleEnabled}
                enabled={true}
                onSetMain={handleSetAsMain}
                isPending={false}
                isReplacing={false}
                showDuplicate={true}
              />
            ))
          ) : (
            // Show skeleton cards when no active promotions
            Array.from({ length: 3 }, (_, index) => (
              <PromotionSkeleton key={`skeleton-${index}`} index={index} />
            ))
          )}
        </div>
      </div>


      {/* Other Promotions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <h2 className="text-xl font-semibold">Promociones pendientes o expiradas</h2>
          <span className="text-sm text-muted-foreground">
            ({otherPromotions.length})
          </span>
        
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {otherPromotions.length > 0 ? (
            otherPromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isActive={false}
                onEdit={handleEditPromotion}
                onDelete={handleDeletePromotion}
                onDuplicate={handleDuplicatePromotion}
                onToggleActive={handleToggleEnabled}
                enabled={true}
                onSetMain={handleSetAsMain}
                isPending={false}
                isReplacing={false}
                showDuplicate={true}
              />
            ))
          ) : (
            // Show skeleton cards when no other promotions
            Array.from({ length: 2 }, (_, index) => (
              <PromotionSkeleton key={`skeleton-other-${index}`} index={index} section="other" />
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Eliminar Promoción
            </DialogTitle>
            <DialogDescription className="text-left">
              ¿Estás seguro de que quieres eliminar la promoción
              <span className="font-semibold text-foreground">
                {promotionToDelete?.title}
              </span>?
              <br />
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setPromotionToDelete(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 