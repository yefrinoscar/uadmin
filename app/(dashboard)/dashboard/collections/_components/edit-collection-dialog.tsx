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
import { useFileStorage } from "@/lib/storage";

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
  const { uploadFile, deleteFile } = useFileStorage();

  const openBannerPicker = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
      bannerInputRef.current.click();
    }
  };

  const openVideoPicker = () => {
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
      videoInputRef.current.click();
    }
  };

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
        const bannerProvided = Object.prototype.hasOwnProperty.call(variables, "banner_url");
        const videoProvided = Object.prototype.hasOwnProperty.call(variables, "video_url");

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
                ...(bannerProvided ? { banner_url: variables.banner_url ?? null } : {}),
                ...(videoProvided ? { video_url: variables.video_url ?? null } : {}),
              };
            }
            return collection;
          });
        });

        // Set loading states
        if (bannerProvided && variables.banner_url !== null) {
          setBannerLoading(true);
        }
        if (videoProvided && variables.video_url !== null) {
          setVideoLoading(true);
        }

        return { previousCollections };
      },
      onSuccess: (data, variables) => {
        const bannerProvided = Object.prototype.hasOwnProperty.call(variables, "banner_url");
        const videoProvided = Object.prototype.hasOwnProperty.call(variables, "video_url");
        const updatedFields: string[] = [];

        toast.success("Colección actualizada");

        // Update local state with server data
        if (bannerProvided) {
          setBannerUrl(data.banner_url || "");
          setBannerPreview(data.banner_url || "");
          setBannerLoading(false);
          setOptimisticBanner(null);
          updatedFields.push("Banner");
        }
        if (videoProvided) {
          setVideoUrl(data.video_url || "");
          setVideoPreview(data.video_url || "");
          setVideoLoading(false);
          setOptimisticVideo(null);
          updatedFields.push("Video");
        }

        if (updatedFields.length > 0) {
          toast.success(
            updatedFields.length === 2
              ? "Banner y video actualizados"
              : `${updatedFields[0]} actualizado`
          );
        }

        queryClient.invalidateQueries({ queryKey: [['collections', 'getAll']] });
      },
      onError: (error: any, variables, context) => {
        const bannerProvided = Object.prototype.hasOwnProperty.call(variables, "banner_url");
        const videoProvided = Object.prototype.hasOwnProperty.call(variables, "video_url");

        // Revert optimistic update
        if (context?.previousCollections) {
          queryClient.setQueryData([['collections', 'getAll']], context.previousCollections);
        }

        // Reset loading states
        if (bannerProvided) {
          setBannerLoading(false);
        }
        if (videoProvided) {
          setVideoLoading(false);
        }

        // Revert local state if it was an optimistic update
        if (bannerProvided && optimisticBanner) {
          setBannerUrl(collection.banner_url || "");
          setBannerPreview(collection.banner_url || "");
          setOptimisticBanner(null);
        }
        if (videoProvided && optimisticVideo) {
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

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      try {
        // Upload file to storage
        const publicUrl = await uploadFile(file, 'images', 'collections');

        // Store old banner URL for deletion after successful update
        const oldBannerUrl = collection.banner_url;

        // Update database with new URL
        updateMutation.mutate({
          id: collection.id!,
          banner_url: publicUrl,
        }, {
          onSuccess: async () => {
            // Delete old banner after successful database update
            if (oldBannerUrl) {
              try {
                await deleteFile(oldBannerUrl, 'images');
              } catch (error) {
                console.error('Error deleting old banner:', error);
                // Don't show error to user - file is already replaced
              }
            }
          }
        });

        // Clean up object URL after a short delay to ensure image is loaded
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      } catch (error) {
        console.error('Error uploading banner:', error);
        toast.error("Error al subir el banner");
        setBannerLoading(false);
        setOptimisticBanner(null);
        setBannerPreview(collection.banner_url || "");
        URL.revokeObjectURL(objectUrl);
      }

      // Reset input so the same file can be re-selected later
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
      e.target.value = "";
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("El video no debe superar los 8MB");
        return;
      }

      // Create immediate optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setOptimisticVideo(objectUrl);
      setVideoPreview(objectUrl);
      setVideoLoading(true);

      try {
        // Upload file to storage
        const publicUrl = await uploadFile(file, 'images', 'collections');

        // Store old video URL for deletion after successful update
        const oldVideoUrl = collection.video_url;

        // Update database with new URL
        updateMutation.mutate({
          id: collection.id!,
          video_url: publicUrl,
        }, {
          onSuccess: async () => {
            // Delete old video after successful database update
            if (oldVideoUrl) {
              try {
                await deleteFile(oldVideoUrl, 'images');
              } catch (error) {
                console.error('Error deleting old video:', error);
                // Don't show error to user - file is already replaced
              }
            }
          }
        });

        // Clean up object URL after a short delay to ensure video is loaded
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      } catch (error) {
        console.error('Error uploading video:', error);
        toast.error("Error al subir el video");
        setVideoLoading(false);
        setOptimisticVideo(null);
        setVideoPreview(collection.video_url || "");
        URL.revokeObjectURL(objectUrl);
      }

      // Reset input so the same file can be re-selected later
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      e.target.value = "";
    }
  };

  const removeBanner = async () => {
    setBannerUrl("");
    setBannerPreview("");
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }

    // Delete file from storage if it exists
    if (collection.banner_url) {
      try {
        await deleteFile(collection.banner_url, 'images');
      } catch (error) {
        console.error('Error deleting banner from storage:', error);
      }
    }

    // Auto-save removal
    updateMutation.mutate({
      id: collection.id!,
      banner_url: null,
    });
  };

  const removeVideo = async () => {
    setVideoUrl("");
    setVideoPreview("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    // Delete file from storage if it exists
    if (collection.video_url) {
      try {
        await deleteFile(collection.video_url, 'images');
      } catch (error) {
        console.error('Error deleting video from storage:', error);
      }
    }

    // Auto-save removal
    updateMutation.mutate({
      id: collection.id!,
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
                onClick={openBannerPicker}
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
                onClick={openVideoPicker}
              >
                <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click para subir un video (máx. 8MB)
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
