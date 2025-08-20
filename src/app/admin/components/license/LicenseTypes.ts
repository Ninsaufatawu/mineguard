// License type definitions for consistent use across the application
export const LICENSE_TYPES = {
  MINING_LEASE: 'Mining Lease',
  PROSPECTING: 'Prospecting',
  RECONNAISSANCE: 'Reconnaissance',
  SMALL_SCALE: 'Small Scale'
};

// Function to identify license type from various formats
export function identifyLicenseType(licenseType: string | null | undefined): string {
  if (!licenseType) return 'Unknown';
  
  const type = licenseType.toLowerCase();
  
  if (type.includes('mining lease') || type.includes('mining-lease') || type === 'large scale') {
    return LICENSE_TYPES.MINING_LEASE;
  } else if (type.includes('prospecting') || type === 'medium scale') {
    return LICENSE_TYPES.PROSPECTING;
  } else if (type.includes('reconnaissance')) {
    return LICENSE_TYPES.RECONNAISSANCE;
  } else if (type.includes('small scale') || type === 'small-scale') {
    return LICENSE_TYPES.SMALL_SCALE;
  }
  
  return licenseType; // Return original if no match
}

// License type colors for UI consistency
export const LICENSE_TYPE_COLORS = {
  [LICENSE_TYPES.MINING_LEASE]: 'bg-blue-600',
  [LICENSE_TYPES.PROSPECTING]: 'bg-indigo-500',
  [LICENSE_TYPES.RECONNAISSANCE]: 'bg-purple-500',
  [LICENSE_TYPES.SMALL_SCALE]: 'bg-green-500'
}; 