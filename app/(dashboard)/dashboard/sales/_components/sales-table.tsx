/* eslint-disable */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Sale, SaleStatus } from "@/types/sale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SaleDetails } from "./sale-details"
import { SaleFormDialog } from "./sale-form-dialog"
import { Pencil, MoreHorizontal, Trash2, Eye, Plus, Filter } from "lucide-react"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Helper function to format currency
const formatCurrency = (value: number, currency = "PEN") => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value)
}

// Status badge component
const StatusBadge = ({ status }: { status: SaleStatus }) => {
  const statusConfig = {
    ACTIVE: { label: "Activo", variant: "default" },
    INACTIVE: { label: "No Activo", variant: "secondary" },
    SOLD: { label: "Vendido", variant: "success" },
    RESERVED: { label: "Reservado", variant: "warning" },
  }

  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant as any}>{config.label}</Badge>
  )
}

export function SalesTable() {
  const router = useRouter()
  const trpc = useTRPC()
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "ALL">("ALL")
  const [nameFilter, setNameFilter] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("current_month")
  const [dateTypeFilter, setDateTypeFilter] = useState<"purchase_date" | "sale_date">("sale_date")
  
  // Set up mutations
  const deleteSaleMutation = useMutation(
    trpc.sales.delete.mutationOptions({
      onSuccess: () => {
        refetch()
        toast.success("Venta eliminada correctamente")
      },
      onError: (error: any) => {
        toast.error(`Error al eliminar: ${error.message}`)
      }
    })
  )
  
  const bulkDeleteMutation = useMutation(
    trpc.sales.bulkDelete.mutationOptions({
      onSuccess: () => {
        refetch()
        setRowSelection({})
        toast.success("Ventas eliminadas correctamente")
      },
      onError: (error) => {
        toast.error(`Error al eliminar: ${error.message}`)
      }
    })
  )
  
  // Create query options
  const filters: any = {}
  
  if (statusFilter !== "ALL") {
    filters.status = statusFilter
  }
  
  if (nameFilter) {
    filters.name = nameFilter
  }
  
  filters.datePeriod = dateFilter
  filters.dateType = dateTypeFilter
  
  const sortingField = sorting.length > 0 
    ? { field: sorting[0].id, direction: sorting[0].desc ? "desc" : "asc" as "desc" | "asc" }
    : undefined
  
  const getSalesQueryOptions = trpc.sales.getAll.queryOptions({
    filters,
    pagination: {
      page: pageIndex + 1,
      pageSize,
    },
    sorting: sortingField,
  })
  
  // Get sales data with filters
  const { data, isLoading, refetch } = useQuery(getSalesQueryOptions)
  
  // Define columns
  const columns: ColumnDef<Sale>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium">
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "quantity_sold",
      header: "Vendidas",
      cell: ({ row }) => row.getValue("quantity_sold"),
    },
    {
      accessorKey: "link",
      header: "Link",
      cell: ({ row }) => {
        const link = row.getValue("link") as string | undefined
        return link ? (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline truncate max-w-[150px] inline-block"
          >
            Ver enlace
          </a>
        ) : null
      },
    },
    {
      accessorKey: "purchase_date",
      header: "Fecha de compra",
      cell: ({ row }) => {
        const date = row.getValue("purchase_date") as string | undefined
        return date ? format(new Date(date), "dd MMM yyyy", { locale: es }) : "-"
      },
    },
    {
      accessorKey: "sale_date",
      header: "Fecha de venta",
      cell: ({ row }) => {
        const date = row.getValue("sale_date") as string | undefined
        return date ? format(new Date(date), "dd MMM yyyy", { locale: es }) : "-"
      },
    },
    {
      accessorKey: "size",
      header: "Tamaño",
      cell: ({ row }) => row.getValue("size") || "-",
    },
    {
      accessorKey: "total_price_usd",
      header: "Precio total USA",
      cell: ({ row }) => formatCurrency(row.getValue("total_price_usd"), "USD"),
    },
    {
      accessorKey: "traveler_cost",
      header: "Costo Viajero",
      cell: ({ row }) => {
        const value = row.getValue("traveler_cost") as number | undefined
        return value !== undefined ? formatCurrency(value, "PEN") : "-"
      },
    },
    {
      accessorKey: "warehouse_mobility",
      header: "Movilidad almacén",
      cell: ({ row }) => {
        const value = row.getValue("warehouse_mobility") as number | undefined
        return value !== undefined ? formatCurrency(value, "PEN") : "-"
      },
    },
    {
      accessorKey: "exchange_rate",
      header: "T. cambio",
      cell: ({ row }) => row.getValue("exchange_rate"),
    },
    {
      accessorKey: "peru_price",
      header: "Precio Perú",
      cell: ({ row }) => formatCurrency(row.getValue("peru_price"), "PEN"),
    },
    {
      accessorKey: "sale_price",
      header: "Venta",
      cell: ({ row }) => {
        const value = row.getValue("sale_price") as number | undefined
        return value !== undefined ? formatCurrency(value, "PEN") : "-"
      },
    },
    {
      accessorKey: "shipping",
      header: "Envío",
      cell: ({ row }) => {
        const value = row.getValue("shipping") as number | undefined
        return value !== undefined ? formatCurrency(value, "PEN") : "-"
      },
    },
    {
      accessorKey: "quantity",
      header: "Cantidad",
      cell: ({ row }) => row.getValue("quantity"),
    },
    {
      accessorKey: "profit",
      header: "Ganancia",
      cell: ({ row }) => {
        const value = row.getValue("profit") as number | undefined
        if (value === undefined) return "-"
        return (
          <span className={value < 0 ? "text-red-500" : "text-green-500"}>
            {formatCurrency(value, "PEN")}
          </span>
        )
      },
    },
    {
      accessorKey: "real_profit",
      header: "Ganancia real",
      cell: ({ row }) => {
        const value = row.getValue("real_profit") as number | undefined
        if (value === undefined) return "-"
        return (
          <span className={value < 0 ? "text-red-500" : "text-green-500"}>
            {formatCurrency(value, "PEN")}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sale = row.original
        
        return (
          <div className="flex items-center justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <SaleDetails sale={sale} />
              </DialogContent>
            </Dialog>
            
            <SaleFormDialog 
              sale={sale}
              onSuccess={() => {
                refetch()
                toast.success("Venta actualizada correctamente")
              }}
              trigger={
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
                      deleteSaleMutation.mutate(sale.id)
                    }
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
  
  // Initialize table
  const table = useReactTable({
    data: data?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / data.pageSize) : 0,
  })
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows
    const selectedIds = selectedRows.map(row => row.original.id)
    
    if (selectedIds.length === 0) {
      toast.error("No hay ventas seleccionadas")
      return
    }
    
    if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} ventas?`)) {
      bulkDeleteMutation.mutate(selectedIds)
    }
  }
  
  // Table footer with pagination
  const TableFooter = () => {
    const totalPages = data ? Math.ceil(data.total / pageSize) : 0
    const currentPage = pageIndex + 1
    
    // Generate page numbers to display
    const getPageNumbers = () => {
      const pages = []
      const maxPagesToShow = 5
      
      if (totalPages <= maxPagesToShow) {
        // Show all pages if there are few
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Always show first page
        pages.push(1)
        
        // Calculate start and end of middle pages
        let startPage = Math.max(2, currentPage - 1)
        let endPage = Math.min(totalPages - 1, currentPage + 1)
        
        // Adjust if at the beginning or end
        if (currentPage <= 3) {
          endPage = Math.min(totalPages - 1, 4)
        } else if (currentPage >= totalPages - 2) {
          startPage = Math.max(2, totalPages - 3)
        }
        
        // Add ellipsis after first page if needed
        if (startPage > 2) {
          pages.push("ellipsis1")
        }
        
        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
        
        // Add ellipsis before last page if needed
        if (endPage < totalPages - 1) {
          pages.push("ellipsis2")
        }
        
        // Always show last page
        if (totalPages > 1) {
          pages.push(totalPages)
        }
      }
      
      return pages
    }
    
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {data?.total 
            ? `Mostrando ${(pageIndex * pageSize) + 1}-${Math.min((pageIndex + 1) * pageSize, data.total)} de ${data.total} ventas`
            : "No hay ventas"}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  if (pageIndex > 0) setPageIndex(pageIndex - 1)
                }}
                className={pageIndex === 0 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, i) => (
              page === "ellipsis1" || page === "ellipsis2" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      setPageIndex(Number(page) - 1)
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  if (pageIndex < totalPages - 1) setPageIndex(pageIndex + 1)
                }}
                className={pageIndex >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Input
            placeholder="Buscar por nombre..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="max-w-sm"
          />
          
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as SaleStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">No Activo</SelectItem>
                <SelectItem value="SOLD">Vendido</SelectItem>
                <SelectItem value="RESERVED">Reservado</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtros de fecha</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground mt-2">
                  Tipo de fecha
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={dateTypeFilter === "purchase_date"}
                  onCheckedChange={() => setDateTypeFilter("purchase_date")}
                >
                  Fecha de compra
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateTypeFilter === "sale_date"}
                  onCheckedChange={() => setDateTypeFilter("sale_date")}
                >
                  Fecha de venta
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  Periodo
                </DropdownMenuLabel>
                
                <DropdownMenuCheckboxItem
                  checked={dateFilter === "current_month"}
                  onCheckedChange={() => setDateFilter("current_month")}
                >
                  Mes actual
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateFilter === "last_month"}
                  onCheckedChange={() => setDateFilter("last_month")}
                >
                  Mes anterior
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateFilter === "current_year"}
                  onCheckedChange={() => setDateFilter("current_year")}
                >
                  Año actual
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={dateFilter === "all"}
                  onCheckedChange={() => setDateFilter("all")}
                >
                  Todo el historial
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <SaleFormDialog
            onSuccess={() => {
              refetch()
              toast.success("Venta creada correctamente")
            }}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva venta
              </Button>
            }
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center gap-2 py-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar seleccionados ({table.getSelectedRowModel().rows.length})
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns.length} className="h-16">
                    <div className="h-4 w-full animate-pulse bg-gray-200 rounded"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <TableFooter />
    </div>
  )
}
