"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Image as ImageIcon, Eye, EyeOff, Video, ImagePlus, ExternalLink } from "lucide-react";
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

  const handleViewDev = () => {
    window.open(`https://dev.underla.store/collections/special/${collection.handle}`, '_blank');
  };

  const handleViewProd = () => {
    window.open(`https://underla.store/collections/special/${collection.handle}`, '_blank');
  };

  return (
    <>
      <div 
        className="group relative flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => setIsEditOpen(true)}
      >
        {/* Image - Square */}
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {collection.image_url ? (
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Handle */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">
              {collection.title}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              /{collection.handle}
            </p>
          </div>

          {/* Status and Media Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Badge */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              collection.published 
                ? "bg-green-500 text-white" 
                : "bg-muted text-muted-foreground"
            }`}>
              {collection.published ? "Activo" : "No activo"}
            </div>

            {/* Video Indicator */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
              collection.video_url 
                ? "bg-green-500/10 text-green-600 dark:text-green-500" 
                : "bg-muted text-muted-foreground/60"
            }`}>
              <Video className="h-3 w-3" />
              <span>{collection.video_url ? "Video" : "Sin video"}</span>
            </div>

            {/* Banner Indicator */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
              collection.banner_url 
                ? "bg-green-500/10 text-green-600 dark:text-green-500" 
                : "bg-muted text-muted-foreground/60"
            }`}>
              <ImagePlus className="h-3 w-3" />
              <span>{collection.banner_url ? "Banner" : "Sin banner"}</span>
            </div>
          </div>
        </div>

        {/* Options Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewDev} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver en Desarrollo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewProd} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver en Producción
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
