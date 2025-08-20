"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faArrowRight, 
  faBuilding, 
  faCirclePlus, 
  faCircleInfo, 
  faTriangleExclamation,
  faXmark,
  faUser,
  faUsers,
  faMoneyBillWave,
  faHistory,
  faPassport,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';


interface ApplicantDetailsProps {
  onNext: () => void;
  onBack: () => void;
  formData: {
    companyType: string;
    companyName: string;
    registrationNumber: string;
    taxId: string;
    companyTypeCategory: string;
    companyAddress: string;
    contactName: string;
    contactPosition: string;
    contactEmail: string;
    contactPhone: string;
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
    [key: string]: any;
  };
  updateFormData: (data: Partial<{
    companyType: string;
    companyName: string;
    registrationNumber: string;
    taxId: string;
    companyTypeCategory: string;
    companyAddress: string;
    contactName: string;
    contactPosition: string;
    contactEmail: string;
    contactPhone: string;
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
  }>) => void;
}

const ApplicantDetails: React.FC<ApplicantDetailsProps> = ({ onNext, onBack, formData, updateFormData }) => {
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Applicant Details</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Provide information about your company or register a new one:</p>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
          <Button
            onClick={() => updateFormData({ companyType: 'existing' })}
            variant={formData.companyType === 'existing' ? 'default' : 'outline'}
            className={`flex-1 !rounded-button whitespace-nowrap text-xs sm:text-sm px-2 py-2 h-auto ${formData.companyType === 'existing' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
          >
            <FontAwesomeIcon icon={faBuilding} className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Use Existing Company
          </Button>
          <Button
            onClick={() => updateFormData({ companyType: 'new' })}
            variant={formData.companyType === 'new' ? 'default' : 'outline'}
            className={`flex-1 !rounded-button whitespace-nowrap text-xs sm:text-sm px-2 py-2 h-auto ${formData.companyType === 'new' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
          >
            <FontAwesomeIcon icon={faCirclePlus} className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Register New Company
          </Button>
        </div>
        
        {formData.companyType === 'existing' ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="company" className="text-xs sm:text-sm mb-1 block">Select Company</Label>
                <Select 
                  value={formData.companyName || undefined} 
                  onValueChange={(value) => updateFormData({ companyName: value })}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gold Coast Mining Ltd.">Gold Coast Mining Ltd.</SelectItem>
                    <SelectItem value="Accra Minerals Inc.">Accra Minerals Inc.</SelectItem>
                    <SelectItem value="Add new company...">Add new company...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tax-id" className="text-xs sm:text-sm mb-1 block">Tax Identification Number</Label>
                <Input 
                  id="tax-id" 
                  placeholder="Enter TIN" 
                  value={formData.taxId} 
                  onChange={(e) => updateFormData({ taxId: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
            </div>
            
            <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
              <h4 className="font-medium text-sm sm:text-base text-gray-800 mb-3">Ownership & Experience Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3">
                <div>
                  <Label htmlFor="incorporation-date" className="text-xs sm:text-sm mb-1 block">Incorporation Date</Label>
                  <Input 
                    id="incorporation-date" 
                    type="date"
                    value={formData.incorporationDate} 
                    onChange={(e) => updateFormData({ incorporationDate: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
                <div>
                  <Label htmlFor="vat-registration" className="text-xs sm:text-sm mb-1 block">VAT Registration Number</Label>
                  <Input 
                    id="vat-registration" 
                    placeholder="Enter VAT number (if applicable)" 
                    value={formData.vatRegistration} 
                    onChange={(e) => updateFormData({ vatRegistration: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3">
                <div>
                  <Label htmlFor="ownership-structure" className="text-xs sm:text-sm mb-1 block">
                    
                    Ownership Structure
                  </Label>
                  <Select 
                    value={formData.ownershipStructure || undefined} 
                    onValueChange={(value) => updateFormData({ ownershipStructure: value })}
                  >
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Select ownership structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully-local">100% Ghanaian Owned</SelectItem>
                      <SelectItem value="joint-venture">Joint Venture</SelectItem>
                      <SelectItem value="foreign-majority">Foreign Majority</SelectItem>
                      <SelectItem value="local-majority">Local Majority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="director-citizenship" className="text-xs sm:text-sm mb-1 block">
                   
                    Director's Citizenship
                  </Label>
                  <Select 
                    value={formData.directorCitizenship || undefined} 
                    onValueChange={(value) => updateFormData({ directorCitizenship: value })}
                  >
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Select citizenship status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghanaian">Ghanaian</SelectItem>
                      <SelectItem value="foreign">Foreign</SelectItem>
                      <SelectItem value="dual">Dual Citizenship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3">
                <div>
                  <Label htmlFor="local-ownership" className="text-xs sm:text-sm mb-1 block">
                    
                    Local Ownership (%)
                  </Label>
                  <Input 
                    id="local-ownership" 
                    placeholder="Enter percentage" 
                    value={formData.localOwnershipPercentage} 
                    onChange={(e) => updateFormData({ localOwnershipPercentage: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
                <div>
                  <Label htmlFor="foreign-ownership" className="text-xs sm:text-sm mb-1 block">
                    
                    Foreign Ownership (%)
                  </Label>
                  <Input 
                    id="foreign-ownership" 
                    placeholder="Enter percentage" 
                    value={formData.foreignOwnershipPercentage} 
                    onChange={(e) => updateFormData({ foreignOwnershipPercentage: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3">
                <div>
                  <Label htmlFor="previous-licenses" className="text-xs sm:text-sm mb-1 block">
                   
                    Previous Mining Licenses
                  </Label>
                  <Input 
                    id="previous-licenses" 
                    placeholder="License numbers (comma separated)" 
                    value={formData.previousLicenses} 
                    onChange={(e) => updateFormData({ previousLicenses: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
                <div>
                  <Label htmlFor="mining-experience" className="text-xs sm:text-sm mb-1 block">
                    
                    Years of Mining Experience
                  </Label>
                  <Input 
                    id="mining-experience" 
                    placeholder="Enter years of experience" 
                    value={formData.miningExperience} 
                    onChange={(e) => updateFormData({ miningExperience: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="annual-turnover" className="text-xs sm:text-sm mb-1 block">
                    
                    Annual Turnover (GHS)
                  </Label>
                  <Input 
                    id="annual-turnover" 
                    placeholder="Enter annual turnover" 
                    value={formData.annualTurnover} 
                    onChange={(e) => updateFormData({ annualTurnover: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
                <div>
                  <Label htmlFor="available-capital" className="text-xs sm:text-sm mb-1 block">
                    
                    Available Capital for Project (GHS)
                  </Label>
                  <Input 
                    id="available-capital" 
                    placeholder="Enter available capital" 
                    value={formData.availableCapital} 
                    onChange={(e) => updateFormData({ availableCapital: e.target.value })}
                    className="text-xs sm:text-sm" 
                  />
                </div>
              </div>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 py-2 px-3 sm:p-4">
              <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500 mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <AlertTitle className="text-xs sm:text-sm">Company Information</AlertTitle>
              <AlertDescription className="text-xs">
                Using existing company information. Please ensure all required fields are completed according to the Mining and Minerals Act requirements.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="company-name" className="text-xs sm:text-sm mb-1 block">Company Name</Label>
                <Input 
                  id="company-name" 
                  placeholder="Enter company name" 
                  value={formData.companyName} 
                  onChange={(e) => updateFormData({ companyName: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="registration-number" className="text-xs sm:text-sm mb-1 block">Registration Number</Label>
                <Input 
                  id="registration-number" 
                  placeholder="Enter registration number" 
                  value={formData.registrationNumber} 
                  onChange={(e) => updateFormData({ registrationNumber: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="tax-id-new" className="text-xs sm:text-sm mb-1 block">Tax Identification Number</Label>
                <Input 
                  id="tax-id-new" 
                  placeholder="Enter TIN" 
                  value={formData.taxId} 
                  onChange={(e) => updateFormData({ taxId: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="company-type" className="text-xs sm:text-sm mb-1 block">Company Type</Label>
                <Select 
                  value={formData.companyTypeCategory || undefined} 
                  onValueChange={(value) => updateFormData({ companyTypeCategory: value })}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private Limited Company</SelectItem>
                    <SelectItem value="public">Public Limited Company</SelectItem>
                    <SelectItem value="sole">Sole Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="company-address" className="text-xs sm:text-sm mb-1 block">Registered Address</Label>
              <Textarea 
                id="company-address" 
                placeholder="Enter company address" 
                value={formData.companyAddress} 
                onChange={(e) => updateFormData({ companyAddress: e.target.value })}
                className="resize-none text-xs sm:text-sm" 
              />
            </div>
            
            <h4 className="font-medium text-sm sm:text-base text-gray-800 mb-2 mt-2">Ownership & Experience Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="incorporation-date-new" className="text-xs sm:text-sm mb-1 block">Incorporation Date</Label>
                <Input 
                  id="incorporation-date-new" 
                  type="date"
                  value={formData.incorporationDate} 
                  onChange={(e) => updateFormData({ incorporationDate: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="vat-registration-new" className="text-xs sm:text-sm mb-1 block">VAT Registration Number</Label>
                <Input 
                  id="vat-registration-new" 
                  placeholder="Enter VAT number (if applicable)" 
                  value={formData.vatRegistration} 
                  onChange={(e) => updateFormData({ vatRegistration: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="ownership-structure-new" className="text-xs sm:text-sm mb-1 block">
                  <FontAwesomeIcon icon={faUsers} className="mr-1 text-gray-500" />
                  Ownership Structure
                </Label>
                <Select 
                  value={formData.ownershipStructure || undefined} 
                  onValueChange={(value) => updateFormData({ ownershipStructure: value })}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Select ownership structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully-local">100% Ghanaian Owned</SelectItem>
                    <SelectItem value="joint-venture">Joint Venture</SelectItem>
                    <SelectItem value="foreign-majority">Foreign Majority</SelectItem>
                    <SelectItem value="local-majority">Local Majority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="director-citizenship-new" className="text-xs sm:text-sm mb-1 block">
                  
                  Director's Citizenship
                </Label>
                <Select 
                  value={formData.directorCitizenship || undefined} 
                  onValueChange={(value) => updateFormData({ directorCitizenship: value })}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Select citizenship status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ghanaian">Ghanaian</SelectItem>
                    <SelectItem value="foreign">Foreign</SelectItem>
                    <SelectItem value="dual">Dual Citizenship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="local-ownership-new" className="text-xs sm:text-sm mb-1 block">
                  
                  Local Ownership (%)
                </Label>
                <Input 
                  id="local-ownership-new" 
                  placeholder="Enter percentage" 
                  value={formData.localOwnershipPercentage} 
                  onChange={(e) => updateFormData({ localOwnershipPercentage: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="foreign-ownership-new" className="text-xs sm:text-sm mb-1 block">
                  
                  Foreign Ownership (%)
                </Label>
                <Input 
                  id="foreign-ownership-new" 
                  placeholder="Enter percentage" 
                  value={formData.foreignOwnershipPercentage} 
                  onChange={(e) => updateFormData({ foreignOwnershipPercentage: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="mining-experience-new" className="text-xs sm:text-sm mb-1 block">
                  
                  Years of Mining Experience
                </Label>
                <Input 
                  id="mining-experience-new" 
                  placeholder="Enter years of experience" 
                  value={formData.miningExperience} 
                  onChange={(e) => updateFormData({ miningExperience: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
              <div>
                <Label htmlFor="available-capital-new" className="text-xs sm:text-sm mb-1 block">
                 
                  Available Capital for Project (GHS)
                </Label>
                <Input 
                  id="available-capital-new" 
                  placeholder="Enter available capital" 
                  value={formData.availableCapital} 
                  onChange={(e) => updateFormData({ availableCapital: e.target.value })}
                  className="text-xs sm:text-sm" 
                />
              </div>
            </div>
            
            <Alert className="bg-amber-50 border-amber-200 py-2 px-3 sm:p-4 mt-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <AlertTitle className="text-xs sm:text-sm">Verification Required</AlertTitle>
              <AlertDescription className="text-xs">
                New company registrations require verification by the Minerals Commission. This may take 3-5 business days. 
                Mining licenses for new companies may require additional documentation and financial guarantees.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
        <h4 className="font-medium text-sm sm:text-base text-gray-800">Contact Person Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="contact-name" className="text-xs sm:text-sm mb-1 block">Full Name</Label>
            <Input 
              id="contact-name" 
              placeholder="Enter full name" 
              value={formData.contactName} 
              onChange={(e) => updateFormData({ contactName: e.target.value })}
              className="text-xs sm:text-sm" 
            />
          </div>
          <div>
            <Label htmlFor="contact-position" className="text-xs sm:text-sm mb-1 block">Position</Label>
            <Input 
              id="contact-position" 
              placeholder="Enter position" 
              value={formData.contactPosition} 
              onChange={(e) => updateFormData({ contactPosition: e.target.value })}
              className="text-xs sm:text-sm" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="contact-email" className="text-xs sm:text-sm mb-1 block">Email Address</Label>
            <Input 
              id="contact-email" 
              type="email" 
              placeholder="Enter email address" 
              value={formData.contactEmail} 
              onChange={(e) => updateFormData({ contactEmail: e.target.value })}
              className="text-xs sm:text-sm" 
            />
          </div>
          <div>
            <Label htmlFor="contact-phone" className="text-xs sm:text-sm mb-1 block">Phone Number</Label>
            <Input 
              id="contact-phone" 
              placeholder="Enter phone number" 
              value={formData.contactPhone} 
              onChange={(e) => updateFormData({ contactPhone: e.target.value })}
              className="text-xs sm:text-sm" 
            />
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between sm:hidden">
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
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
        </Button>
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
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white !rounded-button whitespace-nowrap text-sm px-4 py-2 h-9"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      {/* Spacer for mobile to prevent content from being hidden behind fixed buttons */}
      <div className="h-16 sm:hidden"></div>
    </div>
  );
};

export default ApplicantDetails; 