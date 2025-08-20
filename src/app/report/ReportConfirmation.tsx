import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Shield, Search, FileText, Plus } from "lucide-react";

interface ReportConfirmationProps {
  reportId: string;
  resetForm: () => void;
}

export default function ReportConfirmation({ reportId, resetForm }: ReportConfirmationProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Thank You!</h2>
        <p className="text-base">Your report has been submitted securely.</p>
      </div>
      <div className="bg-muted p-4 rounded-lg inline-block mx-auto">
        <p className="text-xs mb-1">Report Reference Number:</p>
        <p className="text-xl font-mono font-bold">{reportId}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Please save this number for future reference</p>
      </div>
      <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
        <h3 className="font-medium text-blue-800 text-sm mb-1.5">What happens next?</h3>
        <ul className="space-y-1.5 text-xs text-blue-700">
          <li className="flex items-start">
            <Shield className="h-3 w-3 mt-0.5 mr-1" />
            <span>Our team will review your report within 24-48 hours</span>
          </li>
          <li className="flex items-start">
            <Search className="h-3 w-3 mt-0.5 mr-1" />
            <span>We may verify the information with other sources</span>
          </li>
          <li className="flex items-start">
            <FileText className="h-3 w-3 mt-0.5 mr-1" />
            <span>If actionable, the report will be forwarded to relevant authorities</span>
          </li>
        </ul>
      </div>
      <div className="pt-3">
        <Button onClick={resetForm} className="rounded-button text-sm py-1 h-8">
          <Plus className="mr-1.5 h-3 w-3" />
          Submit Another Report
        </Button>
      </div>
    </div>
  );
} 