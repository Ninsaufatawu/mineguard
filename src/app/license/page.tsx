import React from 'react';
import LicenseApplication from './LicenseApplication';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License Application | MineGuard',
  description: 'Apply for a mining license through the MineGuard platform.',
};

export default function LicensePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <LicenseApplication />
    </div>
  );
} 