"use client";

import React, { JSX } from 'react'; 
import { useState, useMemo, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal, ChevronDown, ChevronUp, ExternalLink, Clock, XCircle, 
  ArrowUpDown, Truck, Info, CheckCircle2, Loader2, Copy, Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { PurchaseRequestList } from "@/trpc/api/routers/requests"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTRPC } from "@/trpc/client"
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// StatusBadge component - Solid background, pill shape design
const StatusBadge: React.FC<{ status: PurchaseRequestStatus }> = ({ status }) => {
  let icon: JSX.Element;
  const text: string = purchaseRequestStatusLabels[status] || status.toString(); 
  let customClassName: string; 

  switch (status?.toLowerCase()) {
    case 'pending':
      icon = <Clock size={14} />;
      customClassName = "bg-yellow-100 text-yellow-700 border border-yellow-300";
      break;
    case 'in_progress':
      icon = <Loader2 size={14} className="animate-spin" />;
      customClassName = "bg-sky-100 text-sky-700 border border-sky-300";
      break;
    case 'in_transit':
      icon = <Truck size={14} />;
      customClassName = "bg-violet-100 text-violet-700 border border-violet-300";
      break;
    case 'completed':
      icon = <CheckCircle2 size={14} />;
      customClassName = "bg-green-100 text-green-700 border border-green-300";
      break;
    case 'cancelled':
      icon = <XCircle size={14} />;
      customClassName = "bg-red-100 text-red-700 border border-red-300";
      break;
    case 'delivered':
      icon = <CheckCircle2 size={14} />; 
      customClassName = "bg-teal-100 text-teal-700 border border-teal-300"; 
      break;
    default:
      icon = <Info size={14} />;
      customClassName = "bg-slate-100 text-slate-700 border border-slate-300";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold min-w-[100px] justify-center",
        customClassName
      )}
    >
      {icon}
      {text}
    </span>
  );
};

interface RequestIdCellProps {
  id: string | null | undefined;
}

const RequestIdCell: React.FC<RequestIdCellProps> = ({ id }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (id) {
      navigator.clipboard.writeText(id)
        .then(() => {
          setCopied(true);
          toast.success("ID copiado al portapapeles");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Error al copiar: ', err);
          toast.error("No se pudo copiar el ID");
        });
    }
  };

  return (
    <div className="font-medium text-muted-foreground flex items-center gap-2">
      <span>#{id || "-"}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-slate-100 dark:hover:bg-slate-800 relative overflow-hidden"
        onClick={handleCopy}
        disabled={!id}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export const RequestsTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [assignUserDialogOpen, setAssignUserDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0, 
    pageSize: 10, 
  })
  const router = useRouter();
  const trpc = useTRPC();

  const queryInput = {
    page: pagination.pageIndex + 1, 
    pageSize: pagination.pageSize,
    status: undefined,
    clientId: undefined,
    text: undefined,
  };
  const queryOptions = trpc.requests.getAll.queryOptions(queryInput);
  const usersQueryOptions = trpc.requests.getUsers.queryOptions();

  const { data: requestsPaginatedData, refetch } = useSuspenseQuery(queryOptions);
  const { data: users = [] } = useSuspenseQuery(usersQueryOptions);
  
  const updateAssignedUserMutation = useMutation(trpc.requests.updateAssignedUser.mutationOptions({
    onSuccess: () => {
      toast.success("Usuario asignado correctamente");
      refetch();
      setAssignUserDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error assigning user:", error);
      toast.error("Error", {
        description: "No se pudo asignar el usuario",
      });
    },
  }));

  const data = requestsPaginatedData?.items ?? [];
  const totalCount = requestsPaginatedData?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const columns = useMemo<ColumnDef<PurchaseRequestList>[]>(() => [
    {
      accessorKey: "id",
      header: "ID de pedido",
      cell: ({ row }) => {
        return <RequestIdCell id={row.original.id} />;
      }
    },
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
      id: "contacto",
      header: "Contacto",
      cell: ({ row }) => {
        const phoneNumber = row.original.client?.phone_number;
        const email = row.original.client?.email;
        
        // If phone number exists, show it preferentially
        if (phoneNumber) {
          return <div className="max-w-[200px] truncate">{phoneNumber}</div>;
        }
        // Otherwise show email if it exists
        else if (email) {
          return <div className="max-w-[200px] truncate">{email}</div>;
        }
        // If neither exists, show dash
        return "-";
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estado
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as PurchaseRequestStatus;
        // Display the status using the new StatusBadge component
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "assigned_user",
      header: "Asignado a",
      cell: ({ row }) => {
        const assignedUser = row.original.assigned_user;
        return (
          <div className="font-medium">
            {assignedUser?.name || "-"}
          </div>
        );
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
            <DropdownMenuItem onClick={() => handleViewDetails(row.original.id)}>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignUser(row.original.id)}>Asignar usuario</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleViewDetails])

  const table = useReactTable<PurchaseRequestList>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), 
    onSortingChange: setSorting,
    onPaginationChange: setPagination, 
    manualPagination: true, 
    pageCount: pageCount, 
    state: {
      sorting,
      pagination, 
    },
  })

  useEffect(() => {
    table.setPageIndex(0);
    // Data will refetch automatically because queryInput to useSuspenseQuery changes
  }, [table]); 

  function handleViewDetails(id: string) {
    router.push(`/dashboard/requests/${id}`);
  }

  function handleAssignUser(id: string) {
    setSelectedRequestId(id);
    setAssignUserDialogOpen(true);
  }

  function handleAssignUserSubmit(userId: string | null) {
    if (selectedRequestId) {
      updateAssignedUserMutation.mutate({
        requestId: selectedRequestId,
        userId: userId
      });
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={assignUserDialogOpen} onOpenChange={setAssignUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Usuario</DialogTitle>
            <DialogDescription>
              Selecciona un usuario para asignar a esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Select onValueChange={(value) => handleAssignUserSubmit(value || null)}>
                <SelectTrigger className="w-full col-span-4">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignUserDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(index);
                  }}
                  isActive={table.getState().pagination.pageIndex === index}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
