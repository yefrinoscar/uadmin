"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle 
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSupabaseClient } from "@/lib/supabase-client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export function PromotionsTable() {
  const [data, setData] = useState<Promotion[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const { getAuthenticatedClient } = useSupabaseClient()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    condition_type: "category" as ConditionType,
    condition_content: "",
    active: true
  })

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      condition_type: "category",
      condition_content: "",
      active: true
    })
    setEditingPromotion(null)
  }

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setData(data || [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast.error("Error loading promotions")
    }
    setIsLoading(false)
  }, [getAuthenticatedClient])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const handleCreatePromotion = async () => {
    if (!formData.name || !formData.title || !formData.condition_content) {
      toast.error("Por favor complete todos los campos requeridos")
      return
    }

    setIsPending(true)
    try {
      const supabase = await getAuthenticatedClient()
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required')
      }

      // Check if we've reached the limit of 2 active promotions
      if (!editingPromotion && data.filter(p => p.active).length >= 2) {
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
            condition_content: formData.condition_content,
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
            condition_content: formData.condition_content,
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
    if (!currentActive && data.filter(p => p.active).length >= 2) {
      toast.error("Solo se permiten 2 promociones activas. Desactive alguna promoción existente.")
      return
    }

    setIsPending(true)
    try {
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
    setFormData({
      name: promotion.name,
      title: promotion.title,
      condition_type: promotion.condition_type,
      condition_content: promotion.condition_content,
      active: promotion.active
    })
    setIsDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<Promotion>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => <div className="max-w-[250px] truncate">{row.getValue("title")}</div>,
      },
      {
        accessorKey: "condition_type",
        header: "Tipo de Condición",
        cell: ({ row }) => {
          const type = row.getValue("condition_type") as string
          return <div>{type === "category" ? "Categoría" : "Productos Específicos"}</div>
        },
      },
      {
        accessorKey: "condition_content",
        header: "Contenido de Condición",
        cell: ({ row }) => <div className="max-w-[250px] truncate">{row.getValue("condition_content")}</div>,
      },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => {
          const active = row.getValue("active") as boolean
          return (
            <Button
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleActive(row.original.id, active)}
              disabled={isPending}
            >
              {active ? "Activa" : "Inactiva"}
            </Button>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditPromotion(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeletePromotion(row.original.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [isPending]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  })

  if (isLoading) return <div>Cargando promociones...</div>

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Buscar promociones..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="ml-auto"
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
              {!editingPromotion && data.filter(p => p.active).length >= 2 && (
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
                <Textarea
                  id="condition_content"
                  value={formData.condition_content}
                  onChange={(e) => setFormData({ ...formData, condition_content: e.target.value })}
                  className="col-span-3"
                  placeholder={formData.condition_type === "category" 
                    ? "Nombre de la categoría" 
                    : "IDs de productos separados por comas"}
                />
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
                disabled={isPending || (!editingPromotion && data.filter(p => p.active).length >= 2 && formData.active)}
              >
                {isPending ? "Guardando..." : editingPromotion ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="h-4 w-4" />,
                          desc: <ChevronDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay promociones disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} promoción(es)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
