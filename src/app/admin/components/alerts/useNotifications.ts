import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationData {
  totalAlerts: number;
  newAlerts: number;
  unvisitedAlerts: number;
  lastChecked: Date;
  lastVisited: Date | null;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData>({
    totalAlerts: 0,
    newAlerts: 0,
    unvisitedAlerts: 0,
    lastChecked: new Date(),
    lastVisited: null
  });
  const [loading, setLoading] = useState(true);

  const fetchNotificationCounts = async () => {
    try {
      // Get last visited timestamp from localStorage
      const lastVisitedStr = localStorage.getItem('alerts_last_visited');
      const lastVisited = lastVisitedStr ? new Date(lastVisitedStr) : null;
      
      // Get total alert counts from all sources
      const [satelliteResponse, reportsResponse, licenseResponse] = await Promise.all([
        supabase.from('satellite_reports').select('id', { count: 'exact' }),
        supabase.from('mining_reports').select('id', { count: 'exact' }),
        supabase.from('license_registrations').select('id', { count: 'exact' })
      ]);

      const totalAlerts = (satelliteResponse.count || 0) + 
                         (reportsResponse.count || 0) + 
                         (licenseResponse.count || 0);

      // Get new alerts since last check (last 24 hours for demo)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [newSatelliteResponse, newReportsResponse, newLicenseResponse] = await Promise.all([
        supabase
          .from('satellite_reports')
          .select('id', { count: 'exact' })
          .gte('created_at', oneDayAgo.toISOString()),
        supabase
          .from('mining_reports')
          .select('id', { count: 'exact' })
          .gte('created_at', oneDayAgo.toISOString()),
        supabase
          .from('license_registrations')
          .select('id', { count: 'exact' })
          .gte('created_at', oneDayAgo.toISOString())
      ]);

      const newAlerts = (newSatelliteResponse.count || 0) + 
                       (newReportsResponse.count || 0) + 
                       (newLicenseResponse.count || 0);

      // Get unvisited alerts (alerts created after last visit)
      let unvisitedAlerts = 0;
      if (lastVisited) {
        const [unvisitedSatelliteResponse, unvisitedReportsResponse, unvisitedLicenseResponse] = await Promise.all([
          supabase
            .from('satellite_reports')
            .select('id', { count: 'exact' })
            .gte('created_at', lastVisited.toISOString()),
          supabase
            .from('mining_reports')
            .select('id', { count: 'exact' })
            .gte('created_at', lastVisited.toISOString()),
          supabase
            .from('license_registrations')
            .select('id', { count: 'exact' })
            .gte('created_at', lastVisited.toISOString())
        ]);

        unvisitedAlerts = (unvisitedSatelliteResponse.count || 0) + 
                         (unvisitedReportsResponse.count || 0) + 
                         (unvisitedLicenseResponse.count || 0);
      } else {
        // If never visited, all alerts are unvisited
        unvisitedAlerts = totalAlerts;
      }

      setNotifications({
        totalAlerts,
        newAlerts,
        unvisitedAlerts,
        lastChecked: new Date(),
        lastVisited
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      setLoading(false);
    }
  };

  const markAsRead = () => {
    setNotifications(prev => ({
      ...prev,
      newAlerts: 0,
      lastChecked: new Date()
    }));
  };

  const markAlertsAsVisited = useCallback(() => {
    const now = new Date();
    console.log('🔔 Marking alerts as visited at:', now.toISOString());
    localStorage.setItem('alerts_last_visited', now.toISOString());
    setNotifications(prev => {
      console.log('🔔 Previous unvisited alerts:', prev.unvisitedAlerts);
      const updated = {
        ...prev,
        unvisitedAlerts: 0,
        lastVisited: now
      };
      console.log('🔔 Updated notifications:', updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchNotificationCounts();
    
    // Set up real-time subscriptions for new alerts
    
    const satelliteChannel = supabase
      .channel('satellite_reports_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'satellite_reports' },
        (payload) => {
          console.log('🛰️ New satellite report detected:', payload);
          fetchNotificationCounts();
        }
      )
      .subscribe();

    const reportsChannel = supabase
      .channel('mining_reports_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'mining_reports' },
        (payload) => {
          console.log('📋 New mining report detected:', payload);
          fetchNotificationCounts();
        }
      )
      .subscribe();

    const licenseChannel = supabase
      .channel('license_registrations_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'license_registrations' },
        (payload) => {
          console.log('📄 New license registration detected:', payload);
          fetchNotificationCounts();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(satelliteChannel);
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(licenseChannel);
    };
  }, []);

  return {
    notifications,
    loading,
    refreshNotifications: fetchNotificationCounts,
    markAsRead,
    markAlertsAsVisited
  };
};
