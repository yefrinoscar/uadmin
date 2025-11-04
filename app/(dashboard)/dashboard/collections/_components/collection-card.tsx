"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { Collection } from "@/trpc/api/routers/collections";
import { EditCollectionDialog } from "./edit-collection-dialog";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.collections.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Colección eliminada");
        queryClient.invalidateQueries({ queryKey: [['collections', 'getAll']] });
      },
      onError: (error: any) => {
        toast.error("Error al eliminar", {
          description: error.message,
        });
      },
    })
  );

  const handleDelete = () => {
    deleteMutation.mutate({ id: collection.id! });
    setIsDeleteOpen(false);
  };

  return (
    <>
      <div className="group relative">
        {/* Image */}
        <div 
          className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer"
          onClick={() => setIsEditOpen(true)}
        >
          {collection.image_url ? (
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Status Indicator */}
          <div className="absolute top-2 left-2">
            {collection.published ? (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            )}
          </div>
          
          {/* Options Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border-0 hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Info */}
        <div className="mt-2 space-y-1">
          <h3 className="font-medium text-sm line-clamp-1">
            {collection.title}
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            /{collection.handle}
          </p>
        </div>
      </div>

      <EditCollectionDialog
        collection={collection}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar colección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La colección "{collection.title}" será
              eliminada permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
