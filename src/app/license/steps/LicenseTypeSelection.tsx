"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faGem, 
  faMagnifyingGlass, 
  faMicroscope, 
  faMountain, 
  faClock, 
  faDollarSign, 
  faXmark 
} from '@fortawesome/free-solid-svg-icons';

interface LicenseTypeSelectionProps {
  onNext: () => void;
  formData: {
    licenseType: string;
    [key: string]: any;
  };
  updateFormData: (data: { licenseType: string }) => void;
}

const LicenseTypeSelection: React.FC<LicenseTypeSelectionProps> = ({ onNext, formData, updateFormData }) => {
  const licenseTypes = [
    {
      id: 'small-scale',
      title: 'Small Scale Mining License',
      description: 'For operations not exceeding 25 acres, using limited equipment and technology.',
      duration: '5 years (renewable)',
      fee: '$1,000',
      icon: <FontAwesomeIcon icon={faGem} className="text-lg" />,
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'reconnaissance',
      title: 'Reconnaissance License',
      description: 'For preliminary exploration activities to identify areas for detailed investigation.',
      duration: '1 year (renewable)',
      fee: '$2,500',
      icon: <FontAwesomeIcon icon={faMagnifyingGlass} className="text-lg" />,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'prospecting',
      title: 'Prospecting License',
      description: 'For detailed exploration to determine the economic value of mineral deposits.',
      duration: '3 years (renewable)',
      fee: '$5,000',
      icon: <FontAwesomeIcon icon={faMicroscope} className="text-lg" />,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'mining-lease',
      title: 'Mining Lease',
      description: 'For full-scale extraction and processing of minerals for commercial purposes.',
      duration: '30 years (renewable)',
      fee: '$10,000',
      icon: <FontAwesomeIcon icon={faMountain} className="text-lg" />,
      color: 'bg-green-100 text-green-700'
    }
  ];
  
  return (
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Select License Type</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose the type of mineral rights license you wish to apply for:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {licenseTypes.map((license) => (
          <div
            key={license.id}
            onClick={() => updateFormData({ licenseType: license.id })}
            className={`border rounded-lg p-3 sm:p-5 cursor-pointer transition-all hover:shadow-md ${
              formData.licenseType === license.id
                ? 'border-indigo-500 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${license.color} flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0`}>
                {license.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-1">{license.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 sm:line-clamp-none">{license.description}</p>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-800">
                    <FontAwesomeIcon icon={faClock} className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> {license.duration}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-800">
                    <FontAwesomeIcon icon={faDollarSign} className="mr-1 h-3 w-3 sm:h-4 sm:w-4 text-gray-500" /> {license.fee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile-optimized navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between sm:hidden">
        <Button
          onClick={() => window.location.href = '/'}
          variant="ghost"
          className="text-gray-500 !rounded-full h-10 w-10 p-0 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => onNext()}
          disabled={!formData.licenseType}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium"
        >
          Continue <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3" />
        </Button>
      </div>
      
      {/* Desktop navigation buttons */}
      <div className="hidden sm:flex justify-between">
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="text-gray-700 !rounded-button whitespace-nowrap hover:bg-gray-100 border-gray-300 text-sm px-3 py-2 h-9"
        >
          <FontAwesomeIcon icon={faXmark} className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button
          onClick={() => onNext()}
          disabled={!formData.licenseType}
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

export default LicenseTypeSelection; 