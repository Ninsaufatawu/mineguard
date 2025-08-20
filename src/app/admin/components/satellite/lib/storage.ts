import { supabase } from './supabaseClient';

/**
 * Upload file to Supabase Storage and return public URL
 */
export async function uploadToSupabase(
  bufferOrString: Buffer | string,
  path: string,
  contentType?: string
): Promise<string> {
  try {
    const bucket = 'satellite-analysis';
    
    // Determine content type if not provided
    if (!contentType) {
      if (path.endsWith('.png')) {
        contentType = 'image/png';
      } else if (path.endsWith('.json') || path.endsWith('.geojson')) {
        contentType = 'application/json';
      } else {
        contentType = 'application/octet-stream';
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, bufferOrString, {
        contentType,
        upsert: true // Overwrite if exists
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Upload multiple files and return their URLs
 */
export async function uploadMultipleFiles(files: {
  buffer: Buffer | string;
  path: string;
  contentType?: string;
}[]): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => 
      uploadToSupabase(file.buffer, file.path, file.contentType)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
}

/**
 * Generate unique file path for analysis results
 */
export function generateAnalysisPath(
  district: string,
  analysisType: string,
  timestamp: string,
  fileType: 'before' | 'after' | 'diff' | 'geojson'
): string {
  const cleanDistrict = district.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const extension = fileType === 'geojson' ? 'geojson' : 'png';
  
  return `${cleanDistrict}/${analysisType}/${timestamp}/${fileType}.${extension}`;
}

/**
 * Delete files from storage (cleanup utility)
 */
export async function deleteFromSupabase(paths: string[]): Promise<void> {
  try {
    const bucket = 'satellite-analysis';
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}
