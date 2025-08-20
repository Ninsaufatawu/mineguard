import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a file to Supabase Storage
 * @param file File to upload
 * @param bucket Bucket name to store the file in
 * @param folder Optional folder path within the bucket
 * @returns Object containing success status, file path and error message if any
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string,
  folder: string = ''
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Generate a unique file name to avoid collisions
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${uuidv4().substring(0, 8)}.${fileExt}`;
    
    // Create the full path including folder if provided
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading file to Supabase Storage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    
    console.log('File uploaded successfully:', data?.path);
    return {
      success: true,
      filePath: data?.path,
    };
  } catch (error) {
    console.error('Exception uploading file to Supabase Storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files Files array to upload
 * @param bucket Bucket name to store the files in
 * @param folder Optional folder path within the bucket
 * @returns Object containing success status, file paths and error message if any
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder: string = ''
): Promise<{ success: boolean; filePaths: string[]; errors: string[] }> {
  const results = await Promise.all(
    files.map((file) => uploadFileToStorage(file, bucket, folder))
  );
  
  const filePaths = results
    .filter((result) => result.success && result.filePath)
    .map((result) => result.filePath as string);
  
  const errors = results
    .filter((result) => !result.success)
    .map((result) => result.error as string);
  
  return {
    success: errors.length === 0,
    filePaths,
    errors,
  };
}

/**
 * Get public URL for a file in Supabase Storage
 * @param bucket Bucket name where the file is stored
 * @param filePath Path to the file within the bucket
 * @returns Public URL for the file
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
} 