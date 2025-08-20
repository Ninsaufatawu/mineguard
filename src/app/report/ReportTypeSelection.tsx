import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";
import { useSession, signIn } from "next-auth/react";

interface ReportTypeSelectionProps {
  reportType: string;
  setReportType: (type: string) => void;
  userTypeError: boolean;
}

export default function ReportTypeSelection({
  reportType,
  setReportType,
  userTypeError,
}: ReportTypeSelectionProps) {
  const { data: session, status } = useSession();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">How would you like to report?</h2>
      {userTypeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-md text-xs">
          Please select a report type to continue
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer border-2 transition-all ${
            reportType === "anonymous" ? "border-primary ring-2 ring-primary/20" : 
            (userTypeError ? "border-red-300" : "border-border")
          }`}
          onClick={() => {
            setReportType("anonymous")
          }}
        >
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center text-base">
              <span className="mr-2 text-lg">🕵️</span>
              Report Anonymously
              <Badge className="ml-2 bg-green-600 text-[10px] py-0 h-4">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-4">
            <CardDescription className="text-xs">
              Submit your report without providing any personal information. Your identity remains completely
              protected.
            </CardDescription>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer border-2 transition-all ${
            reportType === "registered" ? "border-primary ring-2 ring-primary/20" : 
            (userTypeError ? "border-red-300" : "border-border")
          }`}
          onClick={() => {
            if (status === "authenticated") {
              setReportType("registered");
            } else {
              signIn();
            }
          }}
        >
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center text-base">
              <UserCircle className="mr-2 h-4 w-4" />
              Use Registered Account
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-4">
            <CardDescription className="text-xs">
              Sign in to track your reports and receive updates. Your personal information is encrypted and
              protected.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 