import { useSupabaseClient } from '@/lib/supabase-client';

/**
 * Custom hook for file storage operations
 */
export function useFileStorage() {
  const { getAuthenticatedClient } = useSupabaseClient();

  /**
   * Upload a file to Supabase Storage and return the public URL
   */
  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const supabase = await getAuthenticatedClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return publicUrlData.publicUrl;
  };

  /**
   * Delete a file from Supabase Storage
   */
  const deleteFile = async (url: string, bucket: string): Promise<void> => {
    if (!url || !url.includes('/storage/v1/object/public/')) return; // Not a storage URL

    const supabase = await getAuthenticatedClient();

    try {
      // Extract file path from Supabase Storage URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{filePath}
      const urlParts = url.split('/storage/v1/object/public/');
      if (urlParts.length < 2) {
        console.error('Invalid storage URL format:', url);
        return;
      }

      const pathAfterBucket = urlParts[1];
      const bucketPrefix = `${bucket}/`;
      
      if (!pathAfterBucket.startsWith(bucketPrefix)) {
        console.error('URL does not match expected bucket:', url);
        return;
      }

      const filePath = pathAfterBucket.substring(bucketPrefix.length);
      
      if (!filePath) {
        console.error('Could not extract file path from URL:', url);
        return;
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteFile:', error);
      // Don't throw - we don't want to block the UI if file deletion fails
    }
  };

  return {
    uploadFile,
    deleteFile
  };
}
