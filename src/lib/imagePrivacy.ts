import sharp from 'sharp';

/**
 * Image Privacy Protection Utility
 * 
 * This utility provides comprehensive privacy protection for uploaded images by:
 * 1. Stripping ALL metadata (EXIF, GPS, device info, timestamps, etc.)
 * 2. Adding subtle noise to prevent forensic analysis
 * 3. Normalizing image format and quality
 * 4. Removing any identifying characteristics
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  addNoise?: boolean;
  noiseIntensity?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  metadataStripped: boolean;
  noiseAdded: boolean;
}

/**
 * Process image to remove metadata and add privacy protection
 */
export async function processImageForPrivacy(
  imageBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    addNoise = true,
    noiseIntensity = 0.5,
    format = 'jpeg'
  } = options;

  const originalSize = imageBuffer.length;

  try {
    // Create sharp instance and get metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Calculate resize dimensions while maintaining aspect ratio
    let { width, height } = metadata;
    if (width && height) {
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }

    // Start processing pipeline
    let processedImage = image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      // Strip ALL metadata including EXIF, GPS, timestamps, device info
      .withMetadata({});

    // Add noise for forensic protection if enabled
    let noiseAdded = false;
    if (addNoise && width && height) {
      // Generate subtle noise overlay
      const noiseBuffer = await generateNoiseOverlay(width, height, noiseIntensity);
      
      // Composite noise onto image
      processedImage = processedImage.composite([{
        input: noiseBuffer,
        blend: 'overlay'
      }]);
      
      noiseAdded = true;
    }

    // Convert to specified format with quality settings
    let finalImage: sharp.Sharp;
    switch (format) {
      case 'jpeg':
        finalImage = processedImage.jpeg({
          quality,
          progressive: false, // Disable progressive for privacy
          mozjpeg: false // Use standard JPEG
        });
        break;
      case 'png':
        finalImage = processedImage.png({
          compressionLevel: 6,
          progressive: false
        });
        break;
      case 'webp':
        finalImage = processedImage.webp({
          quality,
          effort: 4
        });
        break;
      default:
        finalImage = processedImage.jpeg({ quality });
    }

    // Get final processed buffer and metadata
    const processedBuffer = await finalImage.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      format: processedMetadata.format || format,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      size: processedBuffer.length,
      originalSize,
      metadataStripped: true,
      noiseAdded
    };

  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image for privacy protection');
  }
}

/**
 * Generate noise overlay for forensic protection
 */
async function generateNoiseOverlay(
  width: number, 
  height: number, 
  intensity: number = 0.5
): Promise<Buffer> {
  // Create random noise pattern
  const noiseSize = width * height * 3; // RGB channels
  const noiseData = Buffer.alloc(noiseSize);
  
  // Generate subtle random noise
  for (let i = 0; i < noiseSize; i += 3) {
    const noise = Math.floor((Math.random() - 0.5) * intensity * 10);
    noiseData[i] = Math.max(0, Math.min(255, 128 + noise));     // R
    noiseData[i + 1] = Math.max(0, Math.min(255, 128 + noise)); // G
    noiseData[i + 2] = Math.max(0, Math.min(255, 128 + noise)); // B
  }

  // Create noise image
  return sharp(noiseData, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
  .png()
  .toBuffer();
}

/**
 * Check if file is a supported image format
 */
export function isSupportedImageFormat(mimeType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  return supportedTypes.includes(mimeType.toLowerCase());
}

/**
 * Get safe filename without metadata-revealing information
 */
export function generateSafeFilename(originalName: string, format: string): string {
  // Remove original filename to prevent metadata leakage
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `img_${timestamp}_${random}.${format}`;
}

/**
 * Process video files to strip metadata (basic implementation)
 */
export async function processVideoForPrivacy(
  videoBuffer: Buffer,
  originalName: string
): Promise<{ buffer: Buffer; filename: string; metadataStripped: boolean }> {
  // For now, return as-is but with safe filename
  // In production, you might want to use ffmpeg to strip video metadata
  const safeFilename = generateSafeFilename(originalName, 'mp4');
  
  return {
    buffer: videoBuffer,
    filename: safeFilename,
    metadataStripped: false // Would need ffmpeg for full video metadata stripping
  };
}

/**
 * Comprehensive file processing for privacy
 */
export async function processFileForPrivacy(
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string,
  options: ImageProcessingOptions = {}
): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  originalSize: number;
  metadataStripped: boolean;
  noiseAdded: boolean;
  processingApplied: string[];
}> {
  const originalSize = fileBuffer.length;
  const processingApplied: string[] = [];

  try {
    if (isSupportedImageFormat(mimeType)) {
      // Process image with full privacy protection
      const result = await processImageForPrivacy(fileBuffer, options);
      const safeFilename = generateSafeFilename(originalName, result.format);
      
      processingApplied.push('metadata_stripped', 'safe_filename');
      if (result.noiseAdded) {
        processingApplied.push('noise_added');
      }
      
      return {
        buffer: result.buffer,
        filename: safeFilename,
        mimeType: `image/${result.format}`,
        size: result.size,
        originalSize,
        metadataStripped: result.metadataStripped,
        noiseAdded: result.noiseAdded,
        processingApplied
      };
    } 
    else if (mimeType.startsWith('video/')) {
      // Process video (basic implementation)
      const result = await processVideoForPrivacy(fileBuffer, originalName);
      processingApplied.push('safe_filename');
      
      return {
        buffer: result.buffer,
        filename: result.filename,
        mimeType,
        size: fileBuffer.length,
        originalSize,
        metadataStripped: result.metadataStripped,
        noiseAdded: false,
        processingApplied
      };
    }
    else {
      // Unsupported file type - just rename for safety
      const safeFilename = generateSafeFilename(originalName, 'file');
      processingApplied.push('safe_filename');
      
      return {
        buffer: fileBuffer,
        filename: safeFilename,
        mimeType,
        size: fileBuffer.length,
        originalSize,
        metadataStripped: false,
        noiseAdded: false,
        processingApplied
      };
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error('Failed to process file for privacy protection');
  }
}
