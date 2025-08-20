import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/file-utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Get document and licenseId from form data
    const file = formData.get('file') as File;
    const licenseId = formData.get('licenseId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!licenseId) {
      return NextResponse.json(
        { error: 'No license ID provided' },
        { status: 400 }
      );
    }
    
    // Create folder path based on licenseId
    const folderPath = licenseId;
    
    // Upload file to Supabase storage
    const result = await uploadFileToStorage(
      file,
      'license-documents',
      folderPath
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function config() {
  return {
    api: {
      bodyParser: false, // Disable default body parser for file uploads
    },
  };
} 