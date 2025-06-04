"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { PromotionCard } from "./promotion-card"
import { PromotionFormDialog } from "./promotion-form-dialog"
import { Promotion } from "@/types/promotion"
import { useTRPC } from "@/trpc/client"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"

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
      onSuccess: () => {
        toast.success("Promoción eliminada exitosamente")
      },
      onError: (error) => {
        toast.error(`Error al eliminar la promoción: ${error.message}`)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyActivePromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isActive={true}
                onEdit={handleEditPromotion}
                onDelete={handleDeletePromotion}
                onDuplicate={handleDuplicatePromotion}
                onSetMain={handleSetAsMain}
                isPending={isPending}
                isReplacing={false}
                showDuplicate={true}
              />
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isActive={false}
                onEdit={handleEditPromotion}
                onDelete={handleDeletePromotion}
                onDuplicate={handleDuplicatePromotion}
                onSetMain={handleSetAsMain}
                isPending={isPending}
                isReplacing={false}
                showDuplicate={true}
              />
            ))}
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