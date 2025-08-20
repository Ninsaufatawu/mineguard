"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import LicenseTypeSelection from '@/app/license/steps/LicenseTypeSelection';
import ApplicantDetails from '@/app/license/steps/ApplicantDetails';
import DocumentUpload from '@/app/license/steps/DocumentUpload';
import ConcessionArea from '@/app/license/steps/ConcessionArea';
import ReviewSubmit from '@/app/license/steps/ReviewSubmit';

// Define interface for form data
interface FormData {
  // License Type
  licenseType: string;
  
  // Applicant Details
  companyType: string;
  companyName: string;
  registrationNumber: string;
  taxId: string;
  companyTypeCategory: string;
  companyAddress: string;
  
  // Contact Person
  contactName: string;
  contactPosition: string;
  contactEmail: string;
  contactPhone: string;
  
  // New fields for applicant details
  ownershipStructure: string;
  localOwnershipPercentage: string;
  foreignOwnershipPercentage: string;
  previousLicenses: string;
  miningExperience: string;
  annualTurnover: string;
  availableCapital: string;
  incorporationDate: string;
  vatRegistration: string;
  directorCitizenship: string;
  
  // Document Uploads
  documents: {
    id: string;
    name: string;
    uploaded: boolean;
    status: string;
    file?: File | null;
    isCustom?: boolean;
  }[];
  
  // Concession Area
  areaMethod: string;
  areaSize: string;
  perimeter: string;
  coordinates: string;
  region: string;
  district: string;
  areaDescription: string;
  confirmNoOverlap: boolean;
  
  // Payment Info
  paymentMethod: string;
  terms: boolean;
  regulations: boolean;
}

const LicenseApplication: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Initialize form state with default values
  const [formData, setFormData] = useState<FormData>({
    // License Type
    licenseType: "",
    
    // Applicant Details
    companyType: "existing",
    companyName: "",
    registrationNumber: "",
    taxId: "",
    companyTypeCategory: "",
    companyAddress: "",
    
    // Contact Person
    contactName: "",
    contactPosition: "",
    contactEmail: "",
    contactPhone: "",
    
    // New fields for applicant details
    ownershipStructure: "",
    localOwnershipPercentage: "",
    foreignOwnershipPercentage: "",
    previousLicenses: "",
    miningExperience: "",
    annualTurnover: "",
    availableCapital: "",
    incorporationDate: "",
    vatRegistration: "",
    directorCitizenship: "",
    
    // Document Uploads
    documents: [
      { id: 'business-reg', name: 'Business Registration Certificate', uploaded: false, status: 'not-uploaded' },
      { id: 'tax-clearance', name: 'Tax Clearance Certificate', uploaded: false, status: 'not-uploaded' },
      { id: 'env-permit', name: 'Environmental Permit', uploaded: false, status: 'not-uploaded' },
      { id: 'land-ownership', name: 'Proof of Land Ownership/Access', uploaded: false, status: 'not-uploaded' },
      { id: 'mining-plan', name: 'Mining Plan', uploaded: false, status: 'not-uploaded' },
    ],
    
    // Concession Area
    areaMethod: "map",
    areaSize: "",
    perimeter: "",
    coordinates: "",
    region: "",
    district: "",
    areaDescription: "",
    confirmNoOverlap: false,
    
    // Payment Info
    paymentMethod: "card",
    terms: false,
    regulations: false
  });
  
  // Add submissionId state
  const [submissionId, setSubmissionId] = useState("");
  
  // Handle form data changes
  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Set loading state if needed
      setActiveStep(6);
      
      // Prepare form data for submission
      const submissionData = new FormData();
      
      // Add all form fields
      submissionData.append('licenseType', formData.licenseType);
      submissionData.append('companyType', formData.companyType);
      submissionData.append('companyName', formData.companyName);
      submissionData.append('registrationNumber', formData.registrationNumber);
      submissionData.append('taxId', formData.taxId);
      submissionData.append('companyTypeCategory', formData.companyTypeCategory);
      submissionData.append('companyAddress', formData.companyAddress);
      
      // Contact info
      submissionData.append('contactName', formData.contactName);
      submissionData.append('contactPosition', formData.contactPosition);
      submissionData.append('contactEmail', formData.contactEmail);
      submissionData.append('contactPhone', formData.contactPhone);
      
      // Additional company details
      submissionData.append('ownershipStructure', formData.ownershipStructure);
      submissionData.append('localOwnershipPercentage', formData.localOwnershipPercentage);
      submissionData.append('foreignOwnershipPercentage', formData.foreignOwnershipPercentage);
      submissionData.append('previousLicenses', formData.previousLicenses);
      submissionData.append('miningExperience', formData.miningExperience);
      submissionData.append('annualTurnover', formData.annualTurnover);
      submissionData.append('availableCapital', formData.availableCapital);
      submissionData.append('incorporationDate', formData.incorporationDate);
      submissionData.append('vatRegistration', formData.vatRegistration);
      submissionData.append('directorCitizenship', formData.directorCitizenship);
      
      // Area details
      submissionData.append('areaMethod', formData.areaMethod);
      submissionData.append('areaSize', formData.areaSize);
      submissionData.append('perimeter', formData.perimeter || '');
      submissionData.append('coordinates', formData.coordinates || '');
      submissionData.append('region', formData.region);
      submissionData.append('district', formData.district);
      submissionData.append('areaDescription', formData.areaDescription);
      submissionData.append('confirmNoOverlap', formData.confirmNoOverlap ? 'true' : 'false');
      
      // Add documents JSON
      submissionData.append('documents', JSON.stringify(formData.documents));
      
      // Add document files
      formData.documents.forEach(doc => {
        if (doc.uploaded && doc.file) {
          submissionData.append(doc.id, doc.file);
        }
      });
      
      // Submit to API
      const response = await fetch('/api/licenses', {
        method: 'POST',
        body: submissionData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }
      
      console.log('Application submitted successfully!', result);
      
      // Store the license ID from the response
      if (result.license_id) {
        setSubmissionId(result.license_id);
      }
      
      // Show success state
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };
  
  const renderStepContent = () => {
    // If application is submitted, continue showing the ReviewSubmit component
    if (isSubmitted) {
      return (
        <ReviewSubmit 
          onSubmit={handleSubmit} 
          onBack={() => {
            setIsSubmitted(false);
            setActiveStep(5);
          }} 
          formData={formData} 
          updateFormData={updateFormData}
          submissionId={submissionId}
        />
      );
    }
    
    // Otherwise, show the appropriate step
    switch (activeStep) {
      case 1:
        return (
          <LicenseTypeSelection 
            onNext={() => setActiveStep(2)} 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 2:
        return (
          <ApplicantDetails 
            onNext={() => setActiveStep(3)} 
            onBack={() => setActiveStep(1)} 
            formData={formData} 
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <DocumentUpload 
            onNext={() => setActiveStep(4)} 
            onBack={() => setActiveStep(2)} 
            formData={formData} 
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <ConcessionArea 
            onNext={() => setActiveStep(5)} 
            onBack={() => setActiveStep(3)} 
            formData={formData} 
            updateFormData={updateFormData}
          />
        );
      case 5:
      case 6:
        return (
          <ReviewSubmit 
            onSubmit={handleSubmit} 
            onBack={() => setActiveStep(4)} 
            formData={formData} 
            updateFormData={updateFormData}
            submissionId={submissionId}
          />
        );
      default:
        return (
          <LicenseTypeSelection 
            onNext={() => setActiveStep(2)} 
            formData={formData} 
            updateFormData={updateFormData}
          />
        );
    }
  };

  // Step titles with optional short versions for mobile
  const steps = [
    { full: 'License Type', short: 'Type' },
    { full: 'Applicant Details', short: 'Applicant' },
    { full: 'Documents', short: 'Docs' },
    { full: 'Concession Area', short: 'Area' },
    { full: 'Review & Submit', short: 'Review' }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Fixed Quick Exit Button */}
      <div className="fixed top-2 right-2 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-none rounded-full shadow-md px-2 py-1 h-8 sm:h-9"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Exit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Return to homepage</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">New License Application</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Complete the following steps to apply for a mineral rights license</p>
              </div>
              
              {/* Progress Steps - Mobile Responsive */}
              <div className="mb-8">
                <div className="relative flex items-center justify-between w-full mb-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                          index + 1 <= activeStep ? 'bg-green-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1 <= activeStep ? (
                          <FontAwesomeIcon icon={faCheck} className="h-3 w-3 sm:h-5 sm:w-5" />
                        ) : (
                          <span className="text-xs sm:text-sm">{index + 1}</span>
                        )}
                      </div>
                      <p className={`text-[10px] sm:text-xs mt-1 text-center max-w-[60px] sm:max-w-none ${
                        index + 1 === activeStep ? 'text-indigo-600 font-medium' : 'text-gray-500'
                      }`}>
                        <span className="hidden sm:block">{step.full}</span>
                        <span className="sm:hidden">{step.short}</span>
                      </p>
                    </div>
                  ))}
                  
                  {/* Connector lines as background */}
                  <div className="absolute top-3.5 sm:top-5 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
                  <div 
                    className="absolute top-3.5 sm:top-5 left-0 h-0.5 bg-green-500 -z-10 transition-all duration-300"
                    style={{ width: `${(Math.max(0, activeStep - 1) / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Step Content */}
              <div className="mt-6">
                {renderStepContent()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LicenseApplication; 