/**
 * Client-Side Image Privacy Protection
 * 
 * This utility processes images in the browser to strip metadata and add noise
 * BEFORE uploading to the server, ensuring maximum privacy protection.
 */

export interface ClientImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  addNoise?: boolean;
  noiseIntensity?: number;
  stripMetadata?: boolean;
}

export interface ProcessedImageResult {
  file: File;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
  metadataStripped: boolean;
  noiseAdded: boolean;
  processingApplied: string[];
}

/**
 * Process image file in the browser for privacy protection
 */
export async function processImageFileForPrivacy(
  file: File,
  options: ClientImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    addNoise = true,
    noiseIntensity = 0.3,
    stripMetadata = true
  } = options;

  const originalSize = file.size;
  const processingApplied: string[] = [];

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(width / aspectRatio);
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(height * aspectRatio);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas (this automatically strips metadata)
        ctx.drawImage(img, 0, 0, width, height);
        
        if (stripMetadata) {
          processingApplied.push('metadata_stripped');
        }

        // Add subtle noise for forensic protection
        let noiseAdded = false;
        if (addNoise) {
          addNoiseToCanvas(ctx, width, height, noiseIntensity);
          noiseAdded = true;
          processingApplied.push('noise_added');
        }

        // Add resizing to processing applied if dimensions changed
        if (width !== img.width || height !== img.height) {
          processingApplied.push('resized');
        }

        // Convert canvas to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Generate safe filename without metadata-revealing information
            const safeFilename = generateSafeClientFilename(file.name);
            processingApplied.push('safe_filename');

            // Create new File object
            const processedFile = new File([blob], safeFilename, {
              type: 'image/jpeg',
              lastModified: Date.now() // Remove original timestamp
            });

            resolve({
              file: processedFile,
              originalSize,
              processedSize: processedFile.size,
              width,
              height,
              metadataStripped: stripMetadata,
              noiseAdded,
              processingApplied
            });
          },
          'image/jpeg',
          quality
        );

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Add subtle noise to canvas for forensic protection
 */
function addNoiseToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.3
): void {
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Add subtle random noise to each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Generate random noise for RGB channels (skip alpha)
    const noiseR = (Math.random() - 0.5) * intensity * 10;
    const noiseG = (Math.random() - 0.5) * intensity * 10;
    const noiseB = (Math.random() - 0.5) * intensity * 10;

    // Apply noise while keeping values in valid range
    data[i] = Math.max(0, Math.min(255, data[i] + noiseR));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseG)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseB)); // B
    // data[i + 3] is alpha, leave unchanged
  }

  // Put modified image data back to canvas
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate safe filename without revealing metadata
 */
function generateSafeClientFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  // Remove original filename to prevent metadata leakage
  return `evidence_${timestamp}_${random}.jpg`;
}

/**
 * Check if file is a supported image format for processing
 */
export function isSupportedImageForProcessing(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  return supportedTypes.includes(file.type.toLowerCase());
}

/**
 * Process multiple files for privacy protection
 */
export async function processMultipleFilesForPrivacy(
  files: File[],
  options: ClientImageProcessingOptions = {}
): Promise<ProcessedImageResult[]> {
  const results: ProcessedImageResult[] = [];
  
  for (const file of files) {
    try {
      if (isSupportedImageForProcessing(file)) {
        const result = await processImageFileForPrivacy(file, options);
        results.push(result);
      } else {
        // For non-image files, just rename them for safety
        const safeFilename = generateSafeClientFilename(file.name);
        const renamedFile = new File([file], safeFilename, {
          type: file.type,
          lastModified: Date.now()
        });
        
        results.push({
          file: renamedFile,
          originalSize: file.size,
          processedSize: renamedFile.size,
          width: 0,
          height: 0,
          metadataStripped: false,
          noiseAdded: false,
          processingApplied: ['safe_filename']
        });
      }
    } catch (error) {
      console.error('Error processing file:', file.name, error);
      
      // If processing fails, at least rename the file
      const safeFilename = generateSafeClientFilename(file.name);
      const fallbackFile = new File([file], safeFilename, {
        type: file.type,
        lastModified: Date.now()
      });
      
      results.push({
        file: fallbackFile,
        originalSize: file.size,
        processedSize: fallbackFile.size,
        width: 0,
        height: 0,
        metadataStripped: false,
        noiseAdded: false,
        processingApplied: ['safe_filename', 'processing_failed']
      });
    }
  }
  
  return results;
}

/**
 * Get processing summary for user feedback
 */
export function getProcessingSummary(results: ProcessedImageResult[]): {
  totalFiles: number;
  metadataStripped: number;
  noiseAdded: number;
  sizeReduction: number;
  processingSuccess: number;
} {
  const totalFiles = results.length;
  const metadataStripped = results.filter(r => r.metadataStripped).length;
  const noiseAdded = results.filter(r => r.noiseAdded).length;
  const processingSuccess = results.filter(r => !r.processingApplied.includes('processing_failed')).length;
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalProcessedSize = results.reduce((sum, r) => sum + r.processedSize, 0);
  const sizeReduction = totalOriginalSize > 0 ? 
    ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100 : 0;
  
  return {
    totalFiles,
    metadataStripped,
    noiseAdded,
    sizeReduction,
    processingSuccess
  };
}
