"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { PromotionCard } from "./promotion-card"
import { PromotionFormDialog } from "./promotion-form-dialog"
import { useTRPC } from "@/trpc/client"
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { Promotion } from "@/lib/schemas/promotion"

// Utility function to check if promotion is currently active based on dates
function isPromotionCurrentlyActive(promotion: Promotion): boolean {
  const now = new Date()
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  
  return now >= startDate && now <= endDate && promotion.active
}

// Utility function to get promotion status
function getPromotionStatus(promotion: Promotion): 'active' | 'expired' | 'pending' | 'inactive' {
  const now = new Date()
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  
  if (!promotion.active) return 'inactive'
  if (now < startDate) return 'pending'
  if (now > endDate) return 'expired'
  return 'active'
}

export function PromotionsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Get all promotions
  const { data: promotions = [] } = useSuspenseQuery(
    trpc.promotions.getAll.queryOptions({ ascending: true })
  )

  // Mutations
  const createPromotionMutation = useMutation(
    trpc.promotions.create.mutationOptions({
      onSuccess: () => {
        toast.success("Promoción creada exitosamente")
        setIsDialogOpen(false)
        setEditingPromotion(null)
      },
      onError: (error) => {
        toast.error(`Error al crear la promoción: ${error.message}`)
      }
    })
  )

  const updatePromotionMutation = useMutation(
    trpc.promotions.update.mutationOptions({
      onSuccess: () => {
        toast.success("Promoción actualizada exitosamente")
        setIsDialogOpen(false)
        setEditingPromotion(null)
      },
      onError: (error) => {
        toast.error(`Error al actualizar la promoción: ${error.message}`)
      }
    })
  )

  const deletePromotionMutation = useMutation(
    trpc.promotions.delete.mutationOptions({
      onMutate: async (deletedPromotionId) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        const queryKey = [['promotions', 'getAll'], { input: { ascending: true }, type: 'query' }]
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
        toast.success("Promoción eliminada exitosamente")
      },
      onSettled: () => {
        // Always refetch after error or success to ensure we have the latest data
        const queryKey = [['promotions', 'getAll'], { input: { ascending: true }, type: 'query' }]
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

    // Sort others by status: pending -> inactive -> expired
    others.sort((a, b) => {
      const statusOrder = { pending: 0, inactive: 1, expired: 2, active: 3 }
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
    const activeCount = promotions.filter(isPromotionCurrentlyActive).length
    
    if (promotion.active && activeCount >= 2) {
      toast.error("No puedes tener más de 2 promociones activas al mismo tiempo")
      return
    }

    await createPromotionMutation.mutateAsync(promotion)
  }

  const handleUpdatePromotion = async (promotion: Promotion) => {
    if (editingPromotion) {
      const activeCount = promotions.filter(p => 
        p.id !== editingPromotion.id && isPromotionCurrentlyActive(p)
      ).length
      
      if (promotion.active && activeCount >= 2) {
        toast.error("No puedes tener más de 2 promociones activas al mismo tiempo")
        return
      }
    }

    await updatePromotionMutation.mutateAsync({
      id: promotion.id,
      promotion: promotion
    })
  }

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta promoción?")) {
      await deletePromotionMutation.mutateAsync(promotion.id)
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
      name: `${promotion.name} (Copia)`,
      title: `${promotion.title} (Copia)`,
      active: false,
      is_main: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await createPromotionMutation.mutateAsync(duplicated)
    toast.success("Promoción duplicada exitosamente")
  }

  const handleSetAsMain = async (promotion: Promotion) => {
    // First, unset any existing main promotion
    const currentMain = promotions.find(p => p.is_main && p.id !== promotion.id)
    if (currentMain) {
      const updatedCurrentMain = { ...currentMain, is_main: false }
      await updatePromotionMutation.mutateAsync({
        id: currentMain.id,
        promotion: updatedCurrentMain
      })
    }

    // Then set this promotion as main
    const updatedPromotion = { ...promotion, is_main: true }
    await updatePromotionMutation.mutateAsync({
      id: promotion.id,
      promotion: updatedPromotion
    })
    
    toast.success("Promoción establecida como principal")
  }

  const handleToggleActive = async (promotion: Promotion) => {
    const newActiveStatus = !promotion.active
    
    // Check if we're trying to activate and would exceed the limit
    if (newActiveStatus) {
      const activeCount = promotions.filter(p => 
        p.id !== promotion.id && isPromotionCurrentlyActive(p)
      ).length
      
      if (activeCount >= 2) {
        toast.error("No puedes tener más de 2 promociones activas al mismo tiempo")
        return
      }
    }

    const updatedPromotion = { ...promotion, active: newActiveStatus }
    await updatePromotionMutation.mutateAsync({
      id: promotion.id,
      promotion: updatedPromotion
    })
    
    toast.success(newActiveStatus ? "Promoción activada" : "Promoción desactivada")
  }

  const isPending = createPromotionMutation.isPending || 
                   updatePromotionMutation.isPending || 
                   deletePromotionMutation.isPending

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
              disabled={isPending}
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
      {currentlyActivePromotions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold">Promociones Activas</h2>
            <span className="text-sm text-muted-foreground">
              ({currentlyActivePromotions.length}/2)
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4" style={{ minWidth: "fit-content" }}>
              {currentlyActivePromotions.map((promotion) => (
                <div key={promotion.id} className="flex-shrink-0 w-80">
                  <PromotionCard
                    promotion={promotion}
                    isActive={true}
                    onEdit={handleEditPromotion}
                    onDelete={handleDeletePromotion}
                    onDuplicate={handleDuplicatePromotion}
                    onToggleActive={handleToggleActive}
                    enabled={true}
                    onSetMain={handleSetAsMain}
                    isPending={isPending}
                    isReplacing={false}
                    showDuplicate={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other Promotions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <h2 className="text-xl font-semibold">Otras Promociones</h2>
          <span className="text-sm text-muted-foreground">
            ({otherPromotions.length})
          </span>
        </div>
        
        {otherPromotions.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4" style={{ minWidth: "fit-content" }}>
              {otherPromotions.map((promotion) => (
                <div key={promotion.id} className="flex-shrink-0 w-80">
                  <PromotionCard
                    promotion={promotion}
                    isActive={false}
                    onEdit={handleEditPromotion}
                    onDelete={handleDeletePromotion}
                    onDuplicate={handleDuplicatePromotion}
                    onToggleActive={handleToggleActive}
                    enabled={true}
                    onSetMain={handleSetAsMain}
                    isPending={isPending}
                    isReplacing={false}
                    showDuplicate={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {promotions.length === 0 
              ? "No hay promociones creadas aún" 
              : searchTerm 
                ? "No se encontraron promociones que coincidan con tu búsqueda"
                : "Todas las promociones están actualmente activas"
            }
          </div>
        )}
      </div>
    </div>
  )
} 