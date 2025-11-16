"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, XIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { PurchaseRequestStatus, purchaseRequestStatuses, purchaseRequestStatusLabels } from '../types';
import { AddRequestDialog } from "./AddRequestDialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useRequestFilters } from "../hooks/useRequestFilters";

export type RequestStatusFilter = '' | PurchaseRequestStatus;

export interface RequestFiltersState {
  text?: string;
  status: RequestStatusFilter;
  clientId?: string;
}

// Type for status options
type StatusOption = {
  value: RequestStatusFilter;
  label: string;
};

// Type for client options
type ClientOption = {
  value: string;
  label: string;
};

// Status ComboBox component
function StatusComboBox({
  value,
  onChange,
}: {
  value: RequestStatusFilter;
  onChange: (value: RequestStatusFilter) => void;
}) {
  const [open, setOpen] = React.useState(false);

  // Create status options array
  const statusOptions: StatusOption[] = [
    { value: "", label: "Todos los Estados" },
    ...purchaseRequestStatuses.map((status) => ({
      value: status,
      label: purchaseRequestStatusLabels[status],
    })),
  ];

  // Find the selected status option
  const selectedStatus = statusOptions.find((option) => option.value === value) || statusOptions[0];

  return (
    <div className="flex items-center space-x-2">
      <p className="text-sm text-muted-foreground">Estado</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start h-9">
            {selectedStatus.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="bottom" align="start" sideOffset={5}>
          <Command>
            <CommandInput placeholder="Filtrar estados..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                {statusOptions.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={(value) => {
                      onChange(value as RequestStatusFilter);
                      setOpen(false);
                    }}
                  >
                    {status.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Client ComboBox component
function ClientComboBox({
  value,
  onChange,
  options,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ClientOption[];
  isLoading: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  // Find the selected client option
  const selectedClient = options.find((option) => option.value === value) || options[0];

  return (
    <div className="flex items-center space-x-2">
      <p className="text-sm text-muted-foreground">Cliente</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start h-9" disabled={isLoading}>
            {isLoading ? "Cargando..." : selectedClient.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="bottom" align="start" sideOffset={5}>
          <Command>
            <CommandInput placeholder="Filtrar clientes..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup>
                {options.map((client) => (
                  <CommandItem
                    key={client.value}
                    value={client.value}
                    onSelect={(value) => {
                      onChange(value);
                      setOpen(false);
                    }}
                  >
                    {client.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function RequestsFilters() {
  const trpc = useTRPC();
  const { filters, setFilters, resetFilters, hasFilters } = useRequestFilters();

  // Local state for the text input field
  const [inputText, setInputText] = useState<string>(filters.text || "");

  // useEffect to debounce calls to setFilters for text search
  useEffect(() => {
    const timerId = setTimeout(() => {
      // Only update if the debounced text is different from the current URL filter text
      if (inputText !== (filters.text || "")) {
        setFilters({ text: inputText || null }); // Send null if inputText is empty
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timerId);
  }, [inputText, filters.text, setFilters]);

  // useEffect to synchronize inputText if filters.text changes externally (e.g., URL, reset)
  useEffect(() => {
    setInputText(filters.text || "");
  }, [filters.text]);

  // Fetch clients for filter dropdown
  const clientFilterOptions = trpc.requests.getClientsForFilter.queryOptions(undefined);
  const { data: clientsForFilter = [], isLoading: isLoadingClients } = useQuery(clientFilterOptions);

  // Create client options array
  const clientOptions: ClientOption[] = [
    { value: "all", label: "Todos los Clientes" },
    ...clientsForFilter.map((client: { id: string; name: string | null }) => ({
      value: client.id,
      label: client.name || "Nombre no disponible",
    })),
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-between items-center w-full max-w-full">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Input
            id="textSearch"
            placeholder="Buscar pedidos..."
            value={inputText} // Controlled by local state for immediate feedback
            onChange={(e) => setInputText(e.target.value)} // Update local state on change
            className="h-9 w-[180px] md:w-[200px]"
          />
        </div>

        <ClientComboBox
          value={filters?.clientId || "all"}
          onChange={(value) => setFilters({ clientId: value === "all" ? null : value })}
          options={clientOptions}
          isLoading={isLoadingClients}
        />

        <StatusComboBox
          value={filters?.status || ""}
          onChange={(value) => setFilters({ status: value === "" ? null : (value as PurchaseRequestStatus) })}
        />

        {hasFilters && (
          <div className="flex items-center">
            <Button variant="outline" onClick={resetFilters} className="h-9">
              <XIcon className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      <AddRequestDialog>
        <Button className="h-9">
          <PlusCircle className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </AddRequestDialog>

    </div>
  );
}
