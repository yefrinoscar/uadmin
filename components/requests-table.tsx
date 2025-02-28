"use client"

import { useState, useEffect, useMemo } from "react"
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
import { MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { ResponseModal } from "./response-modal"
import { RequestsTableSkeleton } from "./requests-table-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type PurchaseRequest = {
  id: string
  description: string
  client: {
    email: string
    phone_number: string
    name?: string
  }
  assigned_user: {
    id: string
    name: string
  }
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
  price?: number
}

// const mockData: PurchaseRequest[] = Array.from({ length: 10 }, (_, i) => ({
//   id: `req-${i + 1}`,
//   description: `Purchase request for ${["Office supplies", "IT equipment", "Furniture", "Marketing materials", "Software licenses"][Math.floor(Math.random() * 5)]}`,
//   client: {
//     email: `client${i + 1}@example.com`,
//     phone_number: `+1234567${i}`,
//     name: `Client ${i + 1}`,
//   },
//   assigned_user: {
//     id: `user-${i + 1}`,
//     name: ["John Doe", "Jane Smith", "Mike Johnson", "Emily Brown", "Chris Lee"][Math.floor(Math.random() * 5)],
//   },
//   status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)] as "pending" | "approved" | "rejected",
//   created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
//   updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
//   price: Math.floor(Math.random() * 10000) + 100,
// }))


export function RequestsTable() {
  const [data, setData] = useState<PurchaseRequest[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRequests()

    const subscription = supabase
      .channel("public:purchase_requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_requests" }, (payload) => {
        console.log("Change received!", payload)
        fetchRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(`
        id,
        description,
        price,
        status,
        response,
        created_at,
        updated_at,
        client:clients(email, phone_number, name),
        assigned_user:users(id, name)
      `)
      .order("created_at", { ascending: true })
      .returns<PurchaseRequest[]>()

    if (error) {
      console.error("Error fetching requests:", error)
      toast("Error", {
        description: "Failed to fetch requests. Using mock data.",
        //variant: "destructive",
      })
      // setData(mockData)
    } else {
      console.log("Fetched data:", data)
      setData(data)
    }
    setIsLoading(false)
  }

  const columns = useMemo<ColumnDef<PurchaseRequest>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => <div className="font-medium">{row.getValue("description") || "-"}</div>,
      },
      {
        accessorKey: "client.name",
        header: "Cliente",
        cell: ({ row }) => <div className="font-medium">{row.original.client.name || "-"}</div>,
      },
      {
        accessorKey: "client.email",
        header: "Correo",
        cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.client.email || "-"}</div>,
      },
      {
        accessorKey: "client.phone_number",
        header: "Teléfono",
        cell: ({ row }) => row.original.client.phone_number || "-",
      },
      {
        accessorKey: "assigned_user.name",
        header: "Asignado a",
        cell: ({ row }) => row.original.assigned_user.name || "-",
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Select
              value={status}
              onValueChange={(value) => handleStatusChange(row.original.id, value as PurchaseRequest["status"])}
            >
              <SelectTrigger className={cn("w-[130px]", status === "approved" && "border-2 border-primary")}>
                <SelectValue>
                  {status === "pending" ? "Pendiente" : 
                   status === "approved" ? "Aprobado" : 
                   status === "rejected" ? "Rechazado" : "-"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Creado",
        cell: ({ row }) => {
          const date = row.getValue("created_at")
          if (!date) return "-"
          
          try {
            const formattedDate = formatDistance(
              new Date(date as string),
              new Date(),
              { addSuffix: true, locale: es }
            )
            return <span title={new Date(date as string).toLocaleString()}>{formattedDate}</span>
          } catch (error) {
            console.error("Error formatting date:", error)
            return new Date(date as string).toLocaleString()
          }
        },
      },
      {
        accessorKey: "updated_at",
        header: "Actualizado",
        cell: ({ row }) => {
          const date = row.getValue("updated_at")
          if (!date) return "-"
          
          try {
            const formattedDate = formatDistance(
              new Date(date as string),
              new Date(),
              { addSuffix: true, locale: es }
            )
            return <span title={new Date(date as string).toLocaleString()}>{formattedDate}</span>
          } catch (error) {
            console.error("Error formatting date:", error)
            return new Date(date as string).toLocaleString()
          }
        },
      },
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
              <DropdownMenuItem onClick={() => handleResponse(row.original)}>Respuesta</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>Ver detalles</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
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

  const handleStatusChange = async (id: string, newStatus: PurchaseRequest["status"]) => {
    const { error } = await supabase
      .from("purchase_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error updating status:", error)
      toast("Error", {
        description: "Failed to update status",
        //variant: "destructive",
      })
    } else {
      fetchRequests()
      toast("Success", {
        description: "Status updated successfully",
      })
    }
  }

  const handleResponse = (request: PurchaseRequest) => {
    setSelectedRequest({
      ...request
    })
    setIsResponseModalOpen(true)
  }

  const handleViewDetails = (id: string) => {
    window.location.href = `/requests/${id}`
  }

  const handleResponseSubmit = async (id: string, response: string) => {
    const { error } = await supabase
      .from("purchase_requests")
      .update({ response, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error submitting response:", error)
      toast("Error", {
        description: "Failed to submit response",
        //variant: "destructive",
      })
    } else {
      fetchRequests()
      toast("Success", {
        description: "Response submitted successfully",
      })
    }
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <RequestsTableSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between py-4">
            <Input
              placeholder="Filtrar pedidos..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
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
        </>
      )}

      <ResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        request={selectedRequest}
        onSubmit={handleResponseSubmit}
      />
    </div>
  )
}
