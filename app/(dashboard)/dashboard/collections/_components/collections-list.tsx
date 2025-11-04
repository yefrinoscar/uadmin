"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { CollectionCard } from "./collection-card";
import { toast } from "sonner";
import { Collection } from "@/trpc/api/routers/collections";
import { motion } from "framer-motion";

export function CollectionsList() {
  const [isSyncing, setIsSyncing] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: collectionsData = [], isLoading } = useSuspenseQuery(
    trpc.collections.getAll.queryOptions()
  );

  // Sort collections: active (published) first
  const collections = [...collectionsData].sort((a, b) => {
    if (a.published === b.published) return 0;
    return a.published ? -1 : 1;
  });

  const syncMutation = useMutation(
    trpc.collections.syncFromShopify.mutationOptions({
      onSuccess: (result: any) => {
        toast.success(
          `Sincronizado exitosamente: ${result.synced} de ${result.total} colecciones`,
          {
            description: result.errors
              ? `${result.errors.length} errores encontrados`
              : undefined,
          }
        );
        queryClient.invalidateQueries({ queryKey: [['collections', 'getAll']] });
        setIsSyncing(false);
      },
      onError: (error: any) => {
        toast.error("Error al sincronizar", {
          description: error.message,
        });
        setIsSyncing(false);
      },
    })
  );

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gestiona las categorias de Shopify con imágenes y videos personalizados.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      <div>

        {collections && collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No collections</h3>
            <p className="text-sm text-muted-foreground mb-4">Sync from Shopify to get started</p>
            <Button onClick={handleSync} disabled={isSyncing} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Sync now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {collections?.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <CollectionCard collection={collection} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
