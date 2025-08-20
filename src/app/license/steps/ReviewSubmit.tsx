"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faPaperPlane, 
  faGem, 
  faFileLines, 
  faTriangleExclamation, 
  faCreditCard, 
  faBuilding, 
  faMobileScreen, 
  faLock, 
  faCircleCheck,
  faCircleInfo,
  faXmark,
  faBuildingColumns,
  faMagnifyingGlass,
  faMicroscope,
  faMountain
} from '@fortawesome/free-solid-svg-icons';
import { Check, Shield, Search, FileText, Plus, Clock, AlertCircle, Home, Copy, ArrowLeft, Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';

// Import Leaflet map dynamically to avoid SSR issues
const MapComponent = dynamic(() => import('@/app/components/AccurateMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[200px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-gray-500 mt-2">Loading map...</p>
      </div>
    </div>
  )
});

interface ReviewSubmitProps {
  onSubmit: () => void;
  onBack: () => void;
  formData: {
    licenseType: string;
    companyName: string;
    registrationNumber: string;
    taxId: string;
    companyTypeCategory: string;
    companyAddress: string;
    contactName: string;
    contactPosition: string;
    contactEmail: string;
    contactPhone: string;
    documents: {
      id: string;
      name: string;
      uploaded: boolean;
      status: string;
      file?: File | null;
      isCustom?: boolean;
    }[];
    areaMethod: string;
    areaSize: string;
    perimeter: string;
    coordinates: string;
    region: string;
    district: string;
    areaDescription: string;
    confirmNoOverlap: boolean;
    paymentMethod: string;
    terms: boolean;
    regulations: boolean;
    [key: string]: any;
  };
  updateFormData: (data: Partial<{
    paymentMethod: string;
    terms: boolean;
    regulations: boolean;
  }>) => void;
  submissionId?: string;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ onSubmit, onBack, formData, updateFormData, submissionId = "" }) => {
  // Show submission confirmation state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localSubmissionId, setLocalSubmissionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the submissionId from props if it exists
  const displaySubmissionId = submissionId || localSubmissionId;
  
  // Get the license details based on the selected license type
  const getLicenseDetails = () => {
    const licenseTypes = {
      'small-scale': {
        title: 'Small Scale Mining License',
        description: 'For operations not exceeding 25 acres, using limited equipment and technology.',
        icon: faGem,
        color: 'bg-amber-100 text-amber-700'
      },
      'reconnaissance': {
        title: 'Reconnaissance License',
        description: 'For preliminary exploration activities to identify areas for detailed investigation.',
        icon: faMagnifyingGlass,
        color: 'bg-blue-100 text-blue-700'
      },
      'prospecting': {
        title: 'Prospecting License',
        description: 'For detailed exploration to determine the economic value of mineral deposits.',
        icon: faMicroscope,
        color: 'bg-purple-100 text-purple-700'
      },
      'mining-lease': {
        title: 'Mining Lease',
        description: 'For full-scale extraction and processing of minerals for commercial purposes.',
        icon: faMountain,
        color: 'bg-green-100 text-green-700'
      }
    };
    
    return licenseTypes[formData.licenseType as keyof typeof licenseTypes] || licenseTypes['small-scale'];
  };
  
  const licenseDetails = getLicenseDetails();
  
  // Handle payment method selection
  const handlePaymentMethodChange = (method: string) => {
    updateFormData({ paymentMethod: method });
  };

  // Generate a unique submission ID if not provided
  const generateSubmissionId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const prefix = formData.licenseType ? formData.licenseType.slice(0, 2).toUpperCase() : "MG";
    return `${prefix}${timestamp}${random}`;
  };

  // Handle submission in the review screen itself
  const handleSubmitForm = async () => {
    try {
      setIsSubmitting(true);
      
      // Generate a local ID if one isn't provided through props
      if (!submissionId) {
        setLocalSubmissionId(generateSubmissionId());
      }
      
      // Submit the form
      await onSubmit();
      
      setIsSubmitting(false);
      setIsSubmitted(true);
      
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting form:', error);
    }
  };

  // Copy submission ID to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(displaySubmissionId)
      .then(() => {
        alert("Submission ID copied to clipboard!");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Reset form and go back to application form
  const resetForm = () => {
    setIsSubmitted(false);
    onBack();
  };

  // If the form has been submitted, show the confirmation page
  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Application Submitted!</h2>
          <p className="text-base">Your license application has been submitted successfully.</p>
        </div>
        
        {/* Application progress indicator */}
        <div className="flex justify-center items-center space-x-2 text-xs text-gray-500 py-2">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="ml-1">License Type</span>
          </div>
          <div className="w-4 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="ml-1">Applicant</span>
          </div>
          <div className="w-4 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="ml-1">Documents</span>
          </div>
          <div className="w-4 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="ml-1">Concession</span>
          </div>
          <div className="w-4 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="ml-1 font-medium">Review & Submit</span>
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-lg inline-block mx-auto relative">
          <p className="text-xs mb-1">Application Reference Number:</p>
          <div className="flex items-center justify-center space-x-2">
            <p className="text-xl font-mono font-bold">{displaySubmissionId}</p>
            <button 
              onClick={copyToClipboard} 
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Please save this number for tracking your application</p>
        </div>
        <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
          <h3 className="font-medium text-blue-800 text-sm mb-1.5">What happens next?</h3>
          <ul className="space-y-1.5 text-xs text-blue-700">
            <li className="flex items-start">
              <Clock className="h-3 w-3 mt-0.5 mr-1.5" />
              <span>Our team will review your application within 7-10 business days</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-3 w-3 mt-0.5 mr-1.5" />
              <span>Your application will be assessed for compliance with mining regulations</span>
            </li>
            <li className="flex items-start">
              <AlertCircle className="h-3 w-3 mt-0.5 mr-1.5" />
              <span>You may be contacted if additional information is needed</span>
            </li>
            <li className="flex items-start">
              <FileText className="h-3 w-3 mt-0.5 mr-1.5" />
              <span>Track your application status using your reference number</span>
            </li>
          </ul>
        </div>
        <div className="pt-3 flex justify-center space-x-4">
          <Button 
            onClick={() => window.location.href = '/'} 
            className="rounded-button text-sm py-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Return to Home Page
          </Button>
          <Button 
            onClick={resetForm} 
            variant="outline"
            className="rounded-button text-sm py-1 h-9"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Review & Submit Application</h3>
      <p className="text-gray-600 mb-6">Please review all information before submitting your application:</p>
      
      <div className="space-y-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">License Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full ${licenseDetails.color} flex items-center justify-center mr-3`}>
                <FontAwesomeIcon icon={licenseDetails.icon} className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{licenseDetails.title}</h4>
                <p className="text-sm text-gray-500">{licenseDetails.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Applicant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Company Name:</span>
                    <span className="text-sm text-gray-900">{formData.companyName || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Registration No:</span>
                    <span className="text-sm text-gray-900">{formData.registrationNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Tax ID:</span>
                    <span className="text-sm text-gray-900">{formData.taxId || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Company Type:</span>
                    <span className="text-sm text-gray-900">{formData.companyTypeCategory ? 
                      formData.companyTypeCategory === 'private' ? 'Private Limited Company' :
                      formData.companyTypeCategory === 'public' ? 'Public Limited Company' :
                      formData.companyTypeCategory === 'sole' ? 'Sole Proprietorship' :
                      formData.companyTypeCategory === 'partnership' ? 'Partnership' : 
                      formData.companyTypeCategory : 'Not provided'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Contact Person</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Name:</span>
                    <span className="text-sm text-gray-900">{formData.contactName || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Position:</span>
                    <span className="text-sm text-gray-900">{formData.contactPosition || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Email:</span>
                    <span className="text-sm text-gray-900">{formData.contactEmail || 'Not provided'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm text-gray-500 w-32">Phone:</span>
                    <span className="text-sm text-gray-900">{formData.contactPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={faFileLines} 
                      className="text-red-500 mr-2 h-4 w-4" 
                    />
                    <span className="text-sm text-gray-900">{doc.name}</span>
                  </div>
                  {doc.status === 'verified' && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                  )}
                  {doc.status === 'pending' && (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                  )}
                  {doc.status === 'not-uploaded' && (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Missing</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-amber-50 border-t border-amber-100">
            <div className="flex items-center text-amber-800 text-sm">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 h-4 w-4" />
              <p>
                {formData.documents.some(doc => doc.status === 'not-uploaded')
                  ? 'Some required documents are missing. You can still submit your application, but it may delay the approval process.'
                  : 'All required documents have been provided. Your application is ready for review.'}
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Concession Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden relative">
                {formData.coordinates ? (
                  <MapComponent
                    key={`review-map-${formData.coordinates}`}
                    center={(() => {
                      try {
                        const coords = JSON.parse(formData.coordinates);
                        return { lat: coords[0], lng: coords[1] };
                      } catch (e) {
                        return { lat: 5.6037, lng: -0.1870 }; // Default to Accra, Ghana
                      }
                    })()}
                    zoom={10}
                    currentLocation={(() => {
                      try {
                        const coords = JSON.parse(formData.coordinates);
                        return { lat: coords[0], lng: coords[1] };
                      } catch (e) {
                        return null;
                      }
                    })()}
                    onLocationSelected={() => {}} // Read-only in review mode
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">No location selected</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500 block">Total Area Size:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.areaSize || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Region:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.region || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">District:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.district || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Area Description:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {formData.areaDescription || 'No description provided'}
                </p>
              </div>
              {formData.coordinates && (
                <div>
                  <span className="text-sm text-gray-500 block">Coordinates:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(() => {
                      try {
                        const coords = JSON.parse(formData.coordinates);
                        return `Latitude: ${coords[0].toFixed(6)}, Longitude: ${coords[1].toFixed(6)}`;
                      } catch (e) {
                        return 'Invalid coordinates format';
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Fees & Payment</CardTitle>
            <CardDescription>Review all applicable fees and select payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Responsive fees table - traditional table on desktop, cards on mobile */}
              <div className="hidden sm:block border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Application Processing Fee</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Initial application review and processing</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$750.00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">License Fee (Small Scale Mining)</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Annual operational license fee</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$2,500.00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Environmental Processing Fee</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Environmental impact assessment review</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$500.00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Land Survey Fee</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Concession area survey and mapping</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$350.00</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Community Development Levy</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Local community development fund contribution</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">$1,000.00</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                      <td className="px-6 py-4 text-sm text-gray-600">All fees inclusive of taxes</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">$5,100.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Mobile-friendly card layout for fees */}
              <div className="sm:hidden space-y-3">
                <div className="border rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900">Application Processing Fee</p>
                        <p className="text-xs text-gray-600 mt-0.5">Initial application review</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">$750.00</div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900">License Fee</p>
                        <p className="text-xs text-gray-600 mt-0.5">Small Scale Mining</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">$2,500.00</div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900">Environmental Processing</p>
                        <p className="text-xs text-gray-600 mt-0.5">Impact assessment review</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">$500.00</div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900">Land Survey Fee</p>
                        <p className="text-xs text-gray-600 mt-0.5">Area survey and mapping</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">$350.00</div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-gray-900">Community Development</p>
                        <p className="text-xs text-gray-600 mt-0.5">Local contribution</p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">$1,000.00</div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-indigo-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-sm text-gray-900">Total</p>
                        <p className="text-xs text-gray-600 mt-0.5">All fees inclusive of taxes</p>
                      </div>
                      <div className="text-base font-bold text-indigo-600 whitespace-nowrap">$5,100.00</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Payment Schedule</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mt-1 mr-2 sm:mr-3 h-3 w-3 sm:h-4 sm:w-4" />
                    <div>
                      <p className="text-xs sm:text-sm text-blue-900">Payment can be made in installments:</p>
                      <ul className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-blue-800">
                        <li>• 50% due at application submission</li>
                        <li>• 25% due after initial approval</li>
                        <li>• 25% due before license issuance</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Desktop payment method selection */}
                <div className="hidden sm:block bg-gray-50 p-6 rounded-lg space-y-6">
                  <h4 className="font-medium text-gray-900">Select Payment Method</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border rounded-lg p-4 bg-white hover:border-indigo-500 cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                      onClick={() => handlePaymentMethodChange('card')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="card" 
                        checked={formData.paymentMethod === 'card'} 
                        onChange={() => handlePaymentMethodChange('card')} 
                        className="hidden" 
                      />
                      <label htmlFor="card" className="flex flex-col cursor-pointer h-full">
                        <div className="flex items-center mb-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                            {formData.paymentMethod === 'card' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                            )}
                          </div>
                          <FontAwesomeIcon icon={faCreditCard} className={`${formData.paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-600'} text-xl mr-3`} />
                          <span className="font-medium">Credit/Debit Card</span>
                        </div>
                        <p className="text-sm text-gray-600">Secure payment via credit or debit card</p>
                        <div className="mt-auto pt-3 flex items-center text-gray-400 text-sm">
                          <i className="fab fa-cc-visa mr-2"></i>
                          <i className="fab fa-cc-mastercard mr-2"></i>
                          <i className="fab fa-cc-amex"></i>
                        </div>
                      </label>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 bg-white hover:border-indigo-500 cursor-pointer transition-all ${formData.paymentMethod === 'bank' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                      onClick={() => handlePaymentMethodChange('bank')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="bank" 
                        checked={formData.paymentMethod === 'bank'} 
                        onChange={() => handlePaymentMethodChange('bank')} 
                        className="hidden" 
                      />
                      <label htmlFor="bank" className="flex flex-col cursor-pointer h-full">
                        <div className="flex items-center mb-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                            {formData.paymentMethod === 'bank' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                            )}
                          </div>
                          <FontAwesomeIcon icon={faBuildingColumns} className={`${formData.paymentMethod === 'bank' ? 'text-indigo-600' : 'text-gray-600'} text-xl mr-3`} />
                          <span className="font-medium">Bank Transfer</span>
                        </div>
                        <p className="text-sm text-gray-600">Direct bank transfer to our account</p>
                        <div className="mt-auto pt-3 text-gray-400 text-sm">
                          <i className="fas fa-lock mr-1"></i> Secure Transfer
                        </div>
                      </label>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 bg-white hover:border-indigo-500 cursor-pointer transition-all ${formData.paymentMethod === 'mobile' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                      onClick={() => handlePaymentMethodChange('mobile')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="mobile" 
                        checked={formData.paymentMethod === 'mobile'} 
                        onChange={() => handlePaymentMethodChange('mobile')} 
                        className="hidden" 
                      />
                      <label htmlFor="mobile" className="flex flex-col cursor-pointer h-full">
                        <div className="flex items-center mb-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                            {formData.paymentMethod === 'mobile' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                            )}
                          </div>
                          <FontAwesomeIcon icon={faMobileScreen} className={`${formData.paymentMethod === 'mobile' ? 'text-indigo-600' : 'text-gray-600'} text-xl mr-3`} />
                          <span className="font-medium">Mobile Money</span>
                        </div>
                        <p className="text-sm text-gray-600">Pay using mobile money services</p>
                        <div className="mt-auto pt-3 text-gray-400 text-sm">
                          <i className="fas fa-check-circle mr-1"></i> Instant Confirmation
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Mobile payment method selection */}
                <div className="sm:hidden bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Select Payment Method</h4>
                  
                  <div 
                    className={`relative border rounded-lg bg-white hover:border-indigo-500 cursor-pointer transition-all overflow-hidden ${formData.paymentMethod === 'card' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                    onClick={() => handlePaymentMethodChange('card')}
                  >
                    <input 
                      type="radio" 
                      name="payment-mobile" 
                      id="card-mobile" 
                      checked={formData.paymentMethod === 'card'} 
                      onChange={() => handlePaymentMethodChange('card')}
                      className="sr-only" 
                    />
                    <label 
                      htmlFor="card-mobile" 
                      className="flex items-center px-3 py-3 cursor-pointer relative"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ${formData.paymentMethod === 'card' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.paymentMethod === 'card' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <FontAwesomeIcon icon={faCreditCard} className={`${formData.paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-600'} h-5 w-5 mr-3`} />
                      <div>
                        <span className="font-medium text-sm">Credit/Debit Card</span>
                        <p className="text-xs text-gray-500 mt-0.5">Visa, Mastercard, etc.</p>
                      </div>
                    </label>
                  </div>
                  
                  <div 
                    className={`relative border rounded-lg bg-white hover:border-indigo-500 cursor-pointer transition-all overflow-hidden ${formData.paymentMethod === 'bank' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                    onClick={() => handlePaymentMethodChange('bank')}
                  >
                    <input 
                      type="radio" 
                      name="payment-mobile" 
                      id="bank-mobile" 
                      checked={formData.paymentMethod === 'bank'} 
                      onChange={() => handlePaymentMethodChange('bank')} 
                      className="sr-only" 
                    />
                    <label 
                      htmlFor="bank-mobile" 
                      className="flex items-center px-3 py-3 cursor-pointer relative"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ${formData.paymentMethod === 'bank' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.paymentMethod === 'bank' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <FontAwesomeIcon icon={faBuildingColumns} className={`${formData.paymentMethod === 'bank' ? 'text-indigo-600' : 'text-gray-600'} h-5 w-5 mr-3`} />
                      <div>
                        <span className="font-medium text-sm">Bank Transfer</span>
                        <p className="text-xs text-gray-500 mt-0.5">Direct bank transfer</p>
                      </div>
                    </label>
                  </div>
                  
                  <div 
                    className={`relative border rounded-lg bg-white hover:border-indigo-500 cursor-pointer transition-all overflow-hidden ${formData.paymentMethod === 'mobile' ? 'border-indigo-500 ring-2 ring-indigo-100' : ''}`}
                    onClick={() => handlePaymentMethodChange('mobile')}
                  >
                    <input 
                      type="radio" 
                      name="payment-mobile" 
                      id="mobile-payment" 
                      checked={formData.paymentMethod === 'mobile'} 
                      onChange={() => handlePaymentMethodChange('mobile')} 
                      className="sr-only" 
                    />
                    <label 
                      htmlFor="mobile-payment" 
                      className="flex items-center px-3 py-3 cursor-pointer relative"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ${formData.paymentMethod === 'mobile' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.paymentMethod === 'mobile' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <FontAwesomeIcon icon={faMobileScreen} className={`${formData.paymentMethod === 'mobile' ? 'text-indigo-600' : 'text-gray-600'} h-5 w-5 mr-3`} />
                      <div>
                        <span className="font-medium text-sm">Mobile Money</span>
                        <p className="text-xs text-gray-500 mt-0.5">Pay via mobile wallet</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4 mb-8">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="terms" 
            checked={formData.terms} 
            onCheckedChange={(checked) => updateFormData({ terms: checked === true })}
          />
          <Label htmlFor="terms" className="text-sm">
            I confirm that all information provided is accurate and complete. I understand that providing false information may result in the rejection of my application and possible legal consequences.
          </Label>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="regulations" 
            checked={formData.regulations} 
            onCheckedChange={(checked) => updateFormData({ regulations: checked === true })}
          />
          <Label htmlFor="regulations" className="text-sm">
            I agree to comply with all applicable mining regulations, environmental standards, and safety requirements as stipulated by the Minerals Commission of Ghana.
          </Label>
        </div>
      </div>
      
      <Alert className="bg-amber-50 border-amber-200 mb-8">
        <div className="flex items-start">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mt-0.5 mr-3 h-5 w-5" />
          <div>
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Your application has some missing documents. You can still submit your application, but it may delay the approval process.</p>
              <p>After submission, you will be able to track your application status and upload any missing documents through your dashboard.</p>
            </AlertDescription>
          </div>
        </div>
      </Alert>
      
      {/* Mobile-optimized navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex flex-col sm:hidden">
        <Button
          onClick={handleSubmitForm}
          disabled={!formData.terms || !formData.regulations || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-2.5 text-sm font-medium mb-2 w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2 h-4 w-4" /> Submit Application
            </>
          )}
        </Button>
        
        <div className="flex justify-between w-full">
          <div className="flex space-x-2">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </Button>
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Desktop navigation buttons */}
      <div className="hidden sm:flex justify-between mt-8">
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="text-gray-700 !rounded-button whitespace-nowrap hover:bg-gray-100 border-gray-300 text-sm px-3 py-2 h-9"
          >
            <FontAwesomeIcon icon={faXmark} className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="!rounded-button whitespace-nowrap text-sm px-3 py-2 h-9"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Button
          onClick={handleSubmitForm}
          disabled={!formData.terms || !formData.regulations || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap text-sm px-5 py-2 h-9"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="mr-2 h-4 w-4" /> Submit Application
            </>
          )}
        </Button>
      </div>
      
      {/* Spacer for mobile to prevent content from being hidden behind fixed buttons */}
      <div className="h-24 sm:hidden"></div>
    </div>
  );
};

export default ReviewSubmit; 