import { LICENSE_TYPES, identifyLicenseType } from "./LicenseTypes";

interface License {
  license_type?: string;
  status?: string;
}

export function calculateLicenseStats(licenses: License[]) {
  const stats = {
    active: 0,
    pending: 0,
    expired: 0,
    revoked: 0,
    total: licenses?.length || 0,
    MiningLease: 0,
    Prospecting: 0,
    Reconnaissance: 0,
    smallScale: 0       
  };
  
  licenses?.forEach(license => {
    // Count by status
    if (license.status === 'active') stats.active++;
    else if (license.status === 'pending') stats.pending++;
    else if (license.status === 'expired') stats.expired++;
    else if (license.status === 'revoked') stats.revoked++;
    
    // Count by license type using standardized identification
    const standardizedType = identifyLicenseType(license.license_type);
    if (standardizedType === LICENSE_TYPES.MINING_LEASE) {
      stats.MiningLease++;
    } else if (standardizedType === LICENSE_TYPES.PROSPECTING) {
      stats.Prospecting++;
    } else if (standardizedType === LICENSE_TYPES.RECONNAISSANCE) {
      stats.Reconnaissance++;
    } else if (standardizedType === LICENSE_TYPES.SMALL_SCALE) {
      stats.smallScale++;
    }
  });
  
  return stats;
} 