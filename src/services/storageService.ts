import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface FileUploadResult {
  url: string;
  name: string;
  size: number;
}

class StorageService {
  async uploadFile(
    file: File,
    bucket: 'avatars' | 'chat-media' | 'documents' = 'chat-media'
  ): Promise<FileUploadResult> {
    if (!isSupabaseConfigured()) {
      // Demo mode fallback: Convert file to Data URL or Object URL
      const objectUrl = URL.createObjectURL(file);
      return {
        url: objectUrl,
        name: file.name,
        size: file.size,
      };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('You must be signed in to upload files.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      name: file.name,
      size: file.size,
    };
  }
}

export const storageService = new StorageService();
