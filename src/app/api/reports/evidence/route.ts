import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToStorage, uploadMultipleFiles } from '@/lib/file-utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Get files and reportId from form data
    const reportId = formData.get('reportId') as string;
    
    if (!reportId) {
      return NextResponse.json(
        { error: 'No report ID provided' },
        { status: 400 }
      );
    }
    
    // Check if multiple files or single file
    const filesData = formData.getAll('files') as File[];
    
    if (!filesData || filesData.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Create folder path based on reportId
    const folderPath = reportId;
    
    // Upload files to Supabase storage
    const result = await uploadMultipleFiles(
      filesData,
      'report-evidence',
      folderPath
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.errors.join(', ') || 'Failed to upload files' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filePaths: result.filePaths,
      message: `${result.filePaths.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    return NextResponse.json(
      { error: 'Failed to upload files' },
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