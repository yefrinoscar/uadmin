"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSupabaseClient } from "@/lib/supabase-client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, AlertCircle, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockPromotions } from "@/lib/mock-data"
import { TagInput } from "@/components/tag-input"

type ConditionType = "category" | "specific_products"

type Promotion = {
  id: string
  name: string
  title: string
  condition_type: ConditionType
  condition_content: string
  created_at: string
  updated_at: string
  active: boolean
}

export function PromotionsGrid() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const { getAuthenticatedClient } = useSupabaseClient()
  const [useMockData, setUseMockData] = useState(true) // Flag to use mock data

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    condition_type: "category" as ConditionType,
    condition_content: "",
    active: true
  })

  // For tag input when condition_type is specific_products
  const [productTags, setProductTags] = useState<string[]>([])

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      condition_type: "category",
      condition_content: "",
      active: true
    })
    setProductTags([])
    setEditingPromotion(null)
  }

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true)
    try {
      if (useMockData) {
        // Use mock data for testing
        setPromotions(mockPromotions as Promotion[]);
        setIsLoading(false);
        return;
      }

      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPromotions(data || [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast.error("Error loading promotions")
    }
    setIsLoading(false)
  }, [getAuthenticatedClient, useMockData])

  const handleCreatePromotion = async () => {
    if (!formData.name || !formData.title) {
      toast.error("Por favor complete todos los campos requeridos")
      return
    }
    
    // Check if condition content is provided based on the selected type
    if (formData.condition_type === "category" && !formData.condition_content) {
      toast.error("Por favor ingrese una categoría")
      return
    }
    
    if (formData.condition_type === "specific_products" && productTags.length === 0) {
      toast.error("Por favor ingrese al menos un producto")
      return
    }

    // Prepare the condition content based on the type
    const conditionContent = formData.condition_type === "category" 
      ? formData.condition_content 
      : productTags.join(', ')

    setIsPending(true)
    try {
      if (useMockData) {
        // Simulate adding/updating promotion with mock data
        if (editingPromotion) {
          // Update existing promotion in mock data
          setPromotions(prevPromotions => 
            prevPromotions.map(p => 
              p.id === editingPromotion.id 
                ? {
                    ...p,
                    name: formData.name,
                    title: formData.title,
                    condition_type: formData.condition_type,
                    condition_content: conditionContent,
                    active: formData.active,
                    updated_at: new Date().toISOString()
                  } 
                : p
            )
          );
          toast.success("Promoción actualizada correctamente (modo simulación)");
        } else {
          // Add new promotion to mock data
          const newPromotion: Promotion = {
            id: `mock-${Date.now()}`,
            name: formData.name,
            title: formData.title,
            condition_type: formData.condition_type,
            condition_content: conditionContent,
            active: formData.active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setPromotions(prev => [newPromotion, ...prev]);
          toast.success("Promoción creada correctamente (modo simulación)");
        }
        
        resetForm();
        setIsDialogOpen(false);
        setIsPending(false);
        return;
      }

      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      // Check if we've reached the limit of 2 active promotions
      if (!editingPromotion && formData.active && promotions.filter(p => p.active).length >= 2) {
        toast.error("Solo se permiten 2 promociones activas. Desactive alguna promoción existente.")
        setIsPending(false)
        return
      }

      // If we're updating a promotion from inactive to active, check the limit
      if (editingPromotion !== null && editingPromotion.active === false && formData.active && promotions.filter(p => p.active).length >= 2) {
        toast.error("Solo se permiten 2 promociones activas. Desactive alguna promoción existente.")
        setIsPending(false)
        return
      }

      if (editingPromotion) {
        // Update existing promotion
        const { error } = await supabase
          .from("promotions")
          .update({
            name: formData.name,
            title: formData.title,
            condition_type: formData.condition_type,
            condition_content: conditionContent,
            active: formData.active,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingPromotion.id)

        if (error) throw error
        toast.success("Promoción actualizada correctamente")
      } else {
        // Create new promotion
        const { error } = await supabase
          .from("promotions")
          .insert({
            name: formData.name,
            title: formData.title,
            condition_type: formData.condition_type,
            condition_content: conditionContent,
            active: formData.active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        toast.success("Promoción creada correctamente")
      }

      resetForm()
      setIsDialogOpen(false)
      fetchPromotions()
    } catch (error) {
      console.error("Error saving promotion:", error)
      toast.error("Error al guardar la promoción")
    }
    setIsPending(false)
  }

  const handleDeletePromotion = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta promoción?")) return

    setIsPending(true)
    try {
      if (useMockData) {
        // Simulate deletion in mock data
        setPromotions(prev => prev.filter(p => p.id !== id));
        toast.success("Promoción eliminada correctamente (modo simulación)");
        setIsPending(false);
        return;
      }

      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Promoción eliminada correctamente")
      fetchPromotions()
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast.error("Error al eliminar la promoción")
    }
    setIsPending(false)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    // If trying to activate and already have 2 active promotions
    if (!currentActive && promotions.filter(p => p.active).length >= 2) {
      toast.error("Solo se permiten 2 promociones activas. Desactive alguna promoción existente.")
      return
    }

    setIsPending(true)
    try {
      if (useMockData) {
        // Simulate toggling active state in mock data
        setPromotions(prev => 
          prev.map(p => 
            p.id === id 
              ? { ...p, active: !currentActive, updated_at: new Date().toISOString() } 
              : p
          )
        );
        toast.success(`Promoción ${!currentActive ? 'activada' : 'desactivada'} correctamente (modo simulación)`);
        setIsPending(false);
        return;
      }

      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from("promotions")
        .update({ 
          active: !currentActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      toast.success(`Promoción ${!currentActive ? 'activada' : 'desactivada'} correctamente`)
      fetchPromotions()
    } catch (error) {
      console.error("Error toggling promotion status:", error)
      toast.error("Error al cambiar el estado de la promoción")
    }
    setIsPending(false)
  }

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    
    // Set form data
    setFormData({
      name: promotion.name,
      title: promotion.title,
      condition_type: promotion.condition_type,
      condition_content: promotion.condition_type === "category" ? promotion.condition_content : "",
      active: promotion.active
    })
    
    // If condition_type is specific_products, parse the condition_content into tags
    if (promotion.condition_type === "specific_products") {
      setProductTags(promotion.condition_content.split(',').map(item => item.trim()).filter(Boolean))
    } else {
      setProductTags([])
    }
    
    setIsDialogOpen(true)
  }

  // Filter promotions based on search query
  const filteredPromotions = promotions.filter(promotion => {
    const searchLower = searchQuery.toLowerCase()
    return (
      promotion.name.toLowerCase().includes(searchLower) ||
      promotion.title.toLowerCase().includes(searchLower) ||
      promotion.condition_content.toLowerCase().includes(searchLower)
    )
  })

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  if (isLoading) return <div>Cargando promociones...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promociones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseMockData(!useMockData)}
          className="mr-2"
        >
          {useMockData ? "Usar datos reales" : "Usar datos de prueba"}
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Promoción
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingPromotion ? "Editar Promoción" : "Nueva Promoción"}</DialogTitle>
              <DialogDescription>
                {editingPromotion 
                  ? "Actualice los detalles de la promoción a continuación."
                  : "Complete los detalles para crear una nueva promoción."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingPromotion && promotions.filter(p => p.active).length >= 2 && formData.active && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Límite alcanzado</AlertTitle>
                  <AlertDescription>
                    Solo se permiten 2 promociones activas. Desactive alguna promoción existente.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Nombre interno de la promoción"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Título
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Título visible para el cliente"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Tipo de Condición
                </Label>
                <RadioGroup
                  value={formData.condition_type}
                  onValueChange={(value) => setFormData({ ...formData, condition_type: value as ConditionType })}
                  className="col-span-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="category" id="category" />
                    <Label htmlFor="category">Categoría</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific_products" id="specific_products" />
                    <Label htmlFor="specific_products">Productos Específicos</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="condition_content" className="text-right">
                  Contenido de Condición
                </Label>
                {formData.condition_type === "category" ? (
                  <Input
                    id="condition_content"
                    value={formData.condition_content}
                    onChange={(e) => setFormData({ ...formData, condition_content: e.target.value })}
                    className="col-span-3"
                    placeholder="Nombre de la categoría"
                  />
                ) : (
                  <div className="col-span-3">
                    <TagInput
                      tags={productTags}
                      setTags={setProductTags}
                      placeholder="Presiona Enter para agregar un producto"
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ingresa el ID de cada producto y presiona Enter
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Estado
                </Label>
                <RadioGroup
                  value={formData.active ? "active" : "inactive"}
                  onValueChange={(value) => setFormData({ ...formData, active: value === "active" })}
                  className="col-span-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">Activa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="inactive" />
                    <Label htmlFor="inactive">Inactiva</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleCreatePromotion} 
                disabled={isPending || 
                  (!editingPromotion && promotions.filter(p => p.active).length >= 2 && formData.active) || 
                  (editingPromotion !== null && editingPromotion.active === false && formData.active && promotions.filter(p => p.active).length >= 2)}
              >
                {isPending ? "Guardando..." : editingPromotion ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.length > 0 ? (
          filteredPromotions.map((promotion) => (
            <Card key={promotion.id} className={cn(
              "transition-all duration-200",
              promotion.active && "border-primary shadow-md"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{promotion.name}</CardTitle>
                    <CardDescription className="mt-1">{promotion.title}</CardDescription>
                  </div>
                  <Badge variant={promotion.active ? "default" : "outline"}>
                    {promotion.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Tipo de Condición:</span>
                  <p className="text-sm text-muted-foreground">
                    {promotion.condition_type === "category" ? "Categoría" : "Productos Específicos"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Contenido de Condición:</span>
                  <p className="text-sm text-muted-foreground break-words">
                    {promotion.condition_content}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleToggleActive(promotion.id, promotion.active)}
                  disabled={isPending || (!promotion.active && promotions.filter(p => p.active).length >= 2)}
                >
                  {promotion.active ? "Desactivar" : "Activar"}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleEditPromotion(promotion)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeletePromotion(promotion.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-40 border rounded-lg">
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No se encontraron promociones con ese criterio de búsqueda." 
                : "No hay promociones disponibles. Crea una nueva promoción para comenzar."}
            </p>
          </div>
        )}
      </div>
      
      {filteredPromotions.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredPromotions.length} de {promotions.length} promociones
          {promotions.filter(p => p.active).length > 0 && (
            <span className="ml-2">
              ({promotions.filter(p => p.active).length} activas)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
