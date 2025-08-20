import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Alert, AlertStats } from './types';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    satellite: 0,
    community: 0,
    system: 0,
    highPriority: 0,
    newAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch alerts from Supabase
  const fetchAlerts = async () => {
    try {
      setError(null);
      
      // Fetch satellite reports from the database
      const { data: satelliteReports, error: satelliteError } = await supabase
        .from('satellite_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (satelliteError) {
        throw satelliteError;
      }

      // Fetch community reports from mining_reports table
      const { data: communityReports, error: communityError } = await supabase
        .from('mining_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (communityError) {
        throw communityError;
      }

      // Fetch license data for system alerts
      const { data: licenseData, error: licenseError } = await supabase
        .from('mining_licenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (licenseError) {
        throw licenseError;
      }

      // Transform satellite reports into alerts format
      const satelliteAlerts: Alert[] = (satelliteReports || []).map((report, index) => {
        const isIllegal = report.is_illegal || false;
        const analysisType = report.analysis_type || 'NDVI';
        const district = report.district || report.district_name || 'Unknown';
        
        return {
          id: `S${String(index + 1).padStart(2, '0')}`,
          description: isIllegal 
            ? `Illegal mining detected - ${analysisType}`
            : `Mining analysis completed - ${analysisType}`,
          location: district,
          source: 'Satellite' as const,
          datetime: new Date(report.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: isIllegal ? 'new' : 'resolved' as const,
          priority: isIllegal ? 'high' : 'medium' as const,
          district: district,
          analysis_type: analysisType,
          is_illegal: isIllegal,
          change_area_km2: report.change_area_km2 || 0,
          before_image_url: report.before_image_url,
          after_image_url: report.after_image_url,
          latitude: report.latitude,
          longitude: report.longitude,
        };
      });

      // Transform community reports into alerts format
      const communityAlerts: Alert[] = (communityReports || []).map((report, index) => ({
        id: `C${String(index + 1).padStart(2, '0')}`,
        description: report.description || 'Community mining report',
        location: report.location || 'Unknown',
        source: 'Report' as const,
        datetime: new Date(report.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: 'new' as const,
        priority: 'medium' as const,
        latitude: report.latitude,
        longitude: report.longitude,
      }));

      // Transform license data into system alerts
      const systemAlerts: Alert[] = (licenseData || []).map((license, index) => {
        const status = license.status?.toLowerCase() || 'unknown';
        const companyName = license.company_name || 'Unknown Company';
        const location = license.region && license.district 
          ? `${license.district}, ${license.region}` 
          : license.location || 'Unknown';

        let alertStatus: 'new' | 'in-progress' | 'resolved' = 'new';
        let alertPriority: 'high' | 'medium' | 'low' = 'medium';
        let description = '';

        // Determine alert details based on license status
        switch (status) {
          case 'pending':
            description = `New license application from ${companyName}`;
            alertStatus = 'new';
            alertPriority = 'high';
            break;
          case 'active':
            // Only show recently activated licenses (within 7 days)
            const activatedDate = new Date(license.updated_at || license.created_at);
            const daysSinceActivation = (Date.now() - activatedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceActivation <= 7) {
              description = `License activated for ${companyName}`;
              alertStatus = 'resolved';
              alertPriority = 'medium';
            } else {
              return null; // Don't show old active licenses
            }
            break;
          case 'expired':
            description = `License expired for ${companyName}`;
            alertStatus = 'new';
            alertPriority = 'high';
            break;
          case 'revoked':
            description = `License revoked for ${companyName}`;
            alertStatus = 'resolved';
            alertPriority = 'high';
            break;
          default:
            description = `License status changed for ${companyName}`;
            alertStatus = 'in-progress';
            alertPriority = 'medium';
        }

        return {
          id: `LIC-${String(index + 1).padStart(3, '0')}`,
          description,
          location,
          source: 'System' as const,
          datetime: new Date(license.updated_at || license.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: alertStatus,
          priority: alertPriority,
          analysis_type: 'License Registration',
        };
      }).filter(Boolean) as Alert[]; // Remove null entries

      // Combine all alerts
      const allAlerts = [...satelliteAlerts, ...communityAlerts, ...systemAlerts];

      // Calculate statistics
      const newStats: AlertStats = {
        total: allAlerts.length,
        satellite: satelliteAlerts.length,
        community: communityAlerts.length,
        system: systemAlerts.length,
        highPriority: allAlerts.filter(alert => alert.priority === 'high').length,
        newAlerts: allAlerts.filter(alert => alert.status === 'new').length,
      };

      setAlerts(allAlerts);
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh alerts
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
  };

  // Initial fetch
  useEffect(() => {
    fetchAlerts();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    stats,
    loading,
    error,
    refreshing,
    handleRefresh,
    fetchAlerts
  };
};
