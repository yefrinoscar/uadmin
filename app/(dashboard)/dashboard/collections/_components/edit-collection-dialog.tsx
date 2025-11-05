"use client";

import { useState, useRef, useEffect } from "react";
import { Collection } from "@/trpc/api/routers/collections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";

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
  const [bannerLoading, setBannerLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [optimisticBanner, setOptimisticBanner] = useState<string | null>(null);
  const [optimisticVideo, setOptimisticVideo] = useState<string | null>(null);
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Sync state when collection changes or dialog opens
  useEffect(() => {
    setBannerUrl(collection.banner_url || "");
    setVideoUrl(collection.video_url || "");
    setBannerPreview(collection.banner_url || "");
    setVideoPreview(collection.video_url || "");
    setBannerLoading(false);
    setVideoLoading(false);
    setOptimisticBanner(null);
    setOptimisticVideo(null);
  }, [collection.banner_url, collection.video_url]);

  const updateMutation = useMutation(
    trpc.collections.update.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: [['collections', 'getAll']] });

        // Snapshot the previous value
        const previousCollections = queryClient.getQueryData([['collections', 'getAll']]);

        // Optimistically update the cache
        queryClient.setQueryData([['collections', 'getAll']], (old: any) => {
          if (!old) return old;
          return old.map((collection: Collection) => {
            if (collection.id === variables.id) {
              return {
                ...collection,
                banner_url: variables.banner_url,
                video_url: variables.video_url,
              };
            }
            return collection;
          });
        });

        // Set loading states
        if (variables.banner_url !== null && variables.banner_url !== undefined) {
          setBannerLoading(true);
        }
        if (variables.video_url !== null && variables.video_url !== undefined) {
          setVideoLoading(true);
        }

        return { previousCollections };
      },
      onSuccess: (data, variables) => {
        toast.success("Colección actualizada");

        // Update local state with server data
        if (variables.banner_url !== null && variables.banner_url !== undefined) {
          setBannerUrl(data.banner_url || "");
          setBannerPreview(data.banner_url || "");
          setBannerLoading(false);
          setOptimisticBanner(null);
        }
        if (variables.video_url !== null && variables.video_url !== undefined) {
          setVideoUrl(data.video_url || "");
          setVideoPreview(data.video_url || "");
          setVideoLoading(false);
          setOptimisticVideo(null);
        }

        queryClient.invalidateQueries({ queryKey: [['collections', 'getAll']] });
      },
      onError: (error: any, variables, context) => {
        // Revert optimistic update
        if (context?.previousCollections) {
          queryClient.setQueryData([['collections', 'getAll']], context.previousCollections);
        }

        // Reset loading states
        setBannerLoading(false);
        setVideoLoading(false);

        // Revert local state if it was an optimistic update
        if (optimisticBanner) {
          setBannerUrl(collection.banner_url || "");
          setBannerPreview(collection.banner_url || "");
          setOptimisticBanner(null);
        }
        if (optimisticVideo) {
          setVideoUrl(collection.video_url || "");
          setVideoPreview(collection.video_url || "");
          setOptimisticVideo(null);
        }

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

      // Create immediate optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setOptimisticBanner(objectUrl);
      setBannerPreview(objectUrl);
      setBannerLoading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBannerUrl(result);

        // Call mutation with data URL (optimistic update will happen in onMutate)
        updateMutation.mutate({
          id: collection.id!,
          banner_url: result,
          video_url: videoUrl || null,
        });

        // Clean up object URL after a short delay to ensure image is loaded
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
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

      // Create immediate optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setOptimisticVideo(objectUrl);
      setVideoPreview(objectUrl);
      setVideoLoading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setVideoUrl(result);

        // Call mutation with data URL (optimistic update will happen in onMutate)
        updateMutation.mutate({
          id: collection.id!,
          banner_url: bannerUrl || null,
          video_url: result,
        });

        // Clean up object URL after a short delay to ensure video is loaded
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setBannerUrl("");
    setBannerPreview("");
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
    // Auto-save removal
    updateMutation.mutate({
      id: collection.id!,
      banner_url: null,
      video_url: videoUrl || null,
    });
  };

  const removeVideo = () => {
    setVideoUrl("");
    setVideoPreview("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    // Auto-save removal
    updateMutation.mutate({
      id: collection.id!,
      banner_url: bannerUrl || null,
      video_url: null,
    });
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

        <div className="space-y-6">
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
                {bannerLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeBanner}
                  disabled={bannerLoading}
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
                {videoLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeVideo}
                  disabled={videoLoading}
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

        </div>
      </DialogContent>
    </Dialog>
  );
}
