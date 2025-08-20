import { NextRequest, NextResponse } from 'next/server';
import { storeLicense, getAllLicenses, getLicenseById, updateLicenseStatus } from '@/lib/license-db';
import { uploadMultipleFiles } from '@/lib/file-utils';
import { v4 as uuidv4 } from 'uuid';

// POST handler to store a new license application
export async function POST(req: NextRequest) {
  try {
    // Get form data from the request
    const formData = await req.formData();
    
    // Extract basic form fields
    const licenseType = formData.get('licenseType') as string;
    const companyType = formData.get('companyType') as string;
    const companyName = formData.get('companyName') as string;
    const registrationNumber = formData.get('registrationNumber') as string;
    const taxId = formData.get('taxId') as string;
    const companyTypeCategory = formData.get('companyTypeCategory') as string;
    const companyAddress = formData.get('companyAddress') as string;
    
    // Contact info
    const contactName = formData.get('contactName') as string;
    const contactPosition = formData.get('contactPosition') as string;
    const contactEmail = formData.get('contactEmail') as string;
    const contactPhone = formData.get('contactPhone') as string;
    
    // Additional company details
    const ownershipStructure = formData.get('ownershipStructure') as string;
    const localOwnershipPercentage = formData.get('localOwnershipPercentage') as string;
    const foreignOwnershipPercentage = formData.get('foreignOwnershipPercentage') as string;
    const previousLicenses = formData.get('previousLicenses') as string;
    const miningExperience = formData.get('miningExperience') as string;
    const annualTurnover = formData.get('annualTurnover') as string;
    const availableCapital = formData.get('availableCapital') as string;
    const incorporationDate = formData.get('incorporationDate') as string;
    const vatRegistration = formData.get('vatRegistration') as string;
    const directorCitizenship = formData.get('directorCitizenship') as string;
    
    // Area details
    const areaMethod = formData.get('areaMethod') as string;
    const areaSize = formData.get('areaSize') as string;
    const perimeter = formData.get('perimeter') as string;
    const coordinates = formData.get('coordinates') as string;
    const region = formData.get('region') as string;
    const district = formData.get('district') as string;
    const areaDescription = formData.get('areaDescription') as string;
    const confirmNoOverlap = formData.get('confirmNoOverlap') === 'true';
    
    // Handle document files
    let documentFiles: File[] = [];
    
    // Process documents array from form data
    const documentsJson = formData.get('documents') as string;
    if (documentsJson) {
      try {
        const documents = JSON.parse(documentsJson);
        for (const doc of documents) {
          if (doc.uploaded && doc.id) {
            const file = formData.get(doc.id) as File;
            if (file) {
              documentFiles.push(file);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing documents JSON:', e);
      }
    }

    // Generate license ID
    const licenseId = `LIC-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Upload document files to Supabase Storage
    let uploadedFilePaths: string[] = [];
    
    if (documentFiles.length > 0) {
      const uploadResult = await uploadMultipleFiles(
        documentFiles,
        'license-documents',
        licenseId
      );
      
      if (uploadResult.success) {
        uploadedFilePaths = uploadResult.filePaths;
      } else {
        console.error('Error uploading documents:', uploadResult.errors);
        return NextResponse.json(
          { error: 'Failed to upload documents' },
          { status: 500 }
        );
      }
    }
    
    // Get client IP and user agent for tracking
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || req.ip || '';
    
    // Prepare license data for storage
    const licenseData = {
      license_id: licenseId,
      license_type: licenseType,
      company_type: companyType,
      company_name: companyName,
      registration_number: registrationNumber,
      tax_id: taxId,
      company_type_category: companyTypeCategory,
      company_address: companyAddress,
      contact_name: contactName,
      contact_position: contactPosition,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      ownership_structure: ownershipStructure,
      local_ownership_percentage: localOwnershipPercentage,
      foreign_ownership_percentage: foreignOwnershipPercentage,
      previous_licenses: previousLicenses,
      mining_experience: miningExperience,
      annual_turnover: annualTurnover,
      available_capital: availableCapital,
      incorporation_date: incorporationDate,
      vat_registration: vatRegistration,
      director_citizenship: directorCitizenship,
      document_files: uploadedFilePaths,
      area_method: areaMethod,
      area_size: areaSize,
      perimeter: perimeter,
      coordinates: coordinates,
      region: region,
      district: district,
      area_description: areaDescription,
      confirm_no_overlap: confirmNoOverlap,
      status: 'pending',
      user_agent: userAgent,
      user_ip: ip,
    };
    
    // Store license data in Supabase
    const result = await storeLicense(licenseData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to store license application' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      license_id: result.license_id,
      message: 'License application submitted successfully'
    });
  } catch (error) {
    console.error('Error processing license application:', error);
    
    return NextResponse.json(
      { error: 'Failed to process license application' },
      { status: 500 }
    );
  }
}

// GET handler to fetch license applications
export async function GET(req: NextRequest) {
  try {
    // Check if requesting a specific license by ID
    const url = new URL(req.url);
    const licenseId = url.searchParams.get('id');
    
    if (licenseId) {
      // Fetch a single license by ID
      const license = await getLicenseById(licenseId);
      
      if (!license) {
        return NextResponse.json(
          { error: 'License not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ license });
    }
    
    // Fetch all licenses
    const licenses = await getAllLicenses();
    
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('Error fetching licenses:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}

// PATCH handler to update license status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseId, status } = body;
    
    if (!licenseId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const success = await updateLicenseStatus(licenseId, status);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update license status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'License status updated successfully'
    });
  } catch (error) {
    console.error('Error updating license status:', error);
    
    return NextResponse.json(
      { error: 'Failed to update license status' },
      { status: 500 }
    );
  }
} 