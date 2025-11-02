"use client";

import { useState, useRef } from "react";
import { Collection } from "@/trpc/api/routers/collections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";

interface EditCollectionDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const [bannerUrl, setBannerUrl] = useState(collection.banner_url || "");
  const [videoUrl, setVideoUrl] = useState(collection.video_url || "");
  const [bannerPreview, setBannerPreview] = useState(collection.banner_url || "");
  const [videoPreview, setVideoPreview] = useState(collection.video_url || "");
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    trpc.collections.update.mutationOptions({
      onSuccess: () => {
        toast.success("Colección actualizada");
        queryClient.invalidateQueries({ queryKey: [['collections', 'getAll']] });
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Error al actualizar", {
          description: error.message,
        });
      },
    })
  );

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El banner no debe superar los 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBannerUrl(result);
        setBannerPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("El video no debe superar los 50MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setVideoUrl(result);
        setVideoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMutation.mutate({
      id: collection.id!,
      banner_url: bannerUrl || null,
      video_url: videoUrl || null,
    });
  };

  const removeBanner = () => {
    setBannerUrl("");
    setBannerPreview("");
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideoUrl("");
    setVideoPreview("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {collection.image_url && (
              <img
                src={collection.image_url}
                alt={collection.title}
                className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <DialogTitle>{collection.title}</DialogTitle>
              <DialogDescription>
                /{collection.handle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Info */}
          {collection.description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {collection.description}
              </p>
            </div>
          )}

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label htmlFor="banner">Banner Personalizado</Label>
            <p className="text-xs text-muted-foreground">Banner principal para la página de la colección</p>
            {bannerPreview ? (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => bannerInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click para subir un banner (máx. 10MB)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 1920x600px
                </p>
              </div>
            )}
            <Input
              ref={bannerInputRef}
              id="banner"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label htmlFor="video">Video Personalizado (Opcional)</Label>
            <p className="text-xs text-muted-foreground">Video destacado para la colección</p>
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click para subir un video (máx. 50MB)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos: MP4, WebM
                </p>
              </div>
            )}
            <Input
              ref={videoInputRef}
              id="video"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
