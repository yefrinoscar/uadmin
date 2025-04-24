"use client"

import { useState, useMemo } from "react"
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
import { MoreHorizontal, ChevronDown, ChevronUp, ExternalLink, Clock, CheckCircle, XCircle, PlusCircle } from "lucide-react" // Added Clock, CheckCircle, XCircle
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
// Removed RequestsTableSkeleton import as Suspense will handle loading
import { PurchaseRequest, PurchaseRequestList } from "@/trpc/api/routers/requests"
// Removed useTRPC import
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { AddRequestDialog } from "./AddRequestDialog"


export function RequestsTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const router = useRouter();
  const trpc = useTRPC();

  // Fetch data using tRPC suspense query
  const queryOptions = trpc.requests.getAll.queryOptions();

  const { data: requestsData, refetch } = useSuspenseQuery(queryOptions) // Added refetch

  const updateStatusMutation = useMutation(trpc.requests.updateStatus.mutationOptions({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch(); // Refetch the data after mutation
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Error", {
        description: "No se pudo actualizar el estado",
      });
    },
  }));


  // Memoize the data to prevent unnecessary re-renders
  // No need for useMemo with useSuspenseQuery as data is stable until refetch
  const data = requestsData ?? [];

  const columns = useMemo<ColumnDef<PurchaseRequestList>[]>(() => [
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="font-medium flex items-center">
          {row.getValue("description") || "-"}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6"
            onClick={() => handleViewDetails(row.original.id)}
            title="Ver detalles"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "client.name",
      header: "Cliente",
      cell: ({ row }) => <div className="font-medium">{row.original.client?.name || "-"}</div>,
    },
    {
      accessorKey: "client.email",
      header: "Correo",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.client?.email || "-"}</div>,
    },
    {
      accessorKey: "client.phone_number",
      header: "Teléfono",
      cell: ({ row }) => row.original.client?.phone_number || "-",
    },
    // {
    //   accessorKey: "assigned_user.name",
    //   header: "Asignado a",
    //   cell: ({ row }) => row.original.assigned_user?.name || "-",
    // },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as PurchaseRequest['status']
        return (
          <Select
            value={status ?? 'pending'} // Provide a default value if status is null
            onValueChange={(value) => handleStatusChange(row.original.id, value as NonNullable<PurchaseRequest["status"]>)}
            disabled={updateStatusMutation.isPending} // Uncommented and enabled disabled state
          >
            <SelectTrigger className={cn("w-[150px]", status === "approved" && "border-2 border-primary")}>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                  {status === "approved" && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                  {status === "rejected" && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                  {status === "pending" ? "Pendiente" :
                    status === "approved" ? "Aprobado" :
                      status === "rejected" ? "Rechazado" : "-"}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Pendiente
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  Aprobado
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                  Rechazado
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    // {
    //   accessorKey: "created_at",
    //   header: "Creado",
    //   cell: ({ row }) => {
    //     const date = row.getValue("created_at")
    //     if (!date) return "-"

    //     try {
    //       const formattedDate = formatDistance(
    //         new Date(date as string),
    //         new Date(),
    //         { addSuffix: true, locale: es }
    //       )
    //       return <span title={new Date(date as string).toLocaleString()}>{formattedDate}</span>
    //     } catch (error) {
    //       console.error("Error formatting date:", error)
    //       return new Date(date as string).toLocaleString()
    //     }
    //   },
    // },
    // {
    //   accessorKey: "updated_at",
    //   header: "Actualizado",
    //   cell: ({ row }) => {
    //     const date = row.getValue("updated_at")
    //     if (!date) return "-"

    //     try {
    //       const formattedDate = formatDistance(
    //         new Date(date as string),
    //         new Date(),
    //         { addSuffix: true, locale: es }
    //       )
    //       return <span title={new Date(date as string).toLocaleString()}>{formattedDate}</span>
    //     } catch (error) {
    //       console.error("Error formatting date:", error)
    //       return new Date(date as string).toLocaleString()
    //     }
    //   },
    // },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>Ver detalles</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    // Removed router from dependencies as it's stable, kept mutation state
  ], [handleViewDetails, handleStatusChange])

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleViewDetails(id: string) {
    router.push(`/dashboard/requests/${id}`);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleStatusChange(id: string, newStatus: NonNullable<PurchaseRequest["status"]>) {
    // Don't allow updates while another update is in progress
    if (updateStatusMutation.isPending) return;

    updateStatusMutation.mutate({ id, status: newStatus }); // Uncommented and connected mutation
  }

  return (
    <div className="space-y-4">
      {/* Removed isLoading check, Suspense handles this */}
        <div className="flex items-center justify-between">
          <Input
            placeholder="Filtrar pedidos..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <AddRequestDialog onRequestAdded={refetch}>
            <Button>
              <PlusCircle className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </AddRequestDialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "flex items-center gap-1 cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp className="ml-2 h-4 w-4" />,
                            desc: <ChevronDown className="ml-2 h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  )
}
