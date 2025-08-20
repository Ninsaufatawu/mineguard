import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faSatellite, 
  faFileAlt, 
  faIdCard, 
  faBell, 
  faMapMarkedAlt,
  faChartLine,
  faExclamationTriangle,
  faCheckCircle,
  faUsers,
  faGlobe, 
  faWater, 
  faMountain, 
  faLeaf, 
  faArrowUp, 
  faArrowDown, 
  faClock, 
  faEye, 
  faDownload, 
  faSync 
} from '@fortawesome/free-solid-svg-icons';
import { HiDocumentReport, HiExclamationCircle } from 'react-icons/hi';
import { MdSatellite, MdVerifiedUser } from 'react-icons/md';
import { FiAlertTriangle } from 'react-icons/fi';
import { Label, Pie, PieChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from '@/lib/supabase';
import ConcessionsMap from './ConcessionsMap';

interface DashboardStats {
  totalReports: number;
  totalLicenses: number;
  activeAlerts: number;
  satelliteAnalyses: number;
  recentActivity: any[];
  chartData: {
    weeklyAlerts: { day: string; alerts: number }[];
    licenseStatus: { status: string; count: number; fill: string }[];
    reportTypes: { type: string; count: number; fill: string }[];
    monthlyTrends: { month: string; reports: number; alerts: number }[];
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCurrentDate(now);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch recent activities from all sources
  const fetchRecentActivities = async () => {
    setActivitiesLoading(true);
    try {
      const activities: any[] = [];
      
      // Fetch recent satellite reports
      const { data: satelliteData, error: satelliteError } = await supabase
        .from('satellite_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!satelliteError && satelliteData) {
        activities.push(...satelliteData.map(report => ({
          id: `sat_${report.id}`,
          type: 'satellite_analysis',
          title: `Satellite analysis completed`,
          description: `${report.analysis_type?.toUpperCase() || 'NDVI'} analysis for ${report.district || 'Unknown area'}`,
          location: report.district || 'Unknown location',
          created_at: report.created_at,
          metadata: {
            analysisType: report.analysis_type,
            changeArea: report.change_area_hectares,
            isIllegal: report.is_illegal,
            district: report.district
          }
        })));
      }
      
      // Fetch recent mining reports
      const { data: miningData, error: miningError } = await supabase
        .from('mining_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!miningError && miningData) {
        activities.push(...miningData.map(report => ({
          id: `mining_${report.id}`,
          type: 'community_report',
          title: 'Community mining report submitted',
          description: `${report.report_type || 'Mining activity'} reported by ${report.reporter_name || 'Anonymous'}`,
          location: report.location || 'Unknown location',
          created_at: report.created_at,
          metadata: {
            reportType: report.report_type,
            reporterName: report.reporter_name,
            severity: report.severity
          }
        })));
      }
      
      // Fetch recent license activities
      const { data: licenseData, error: licenseError } = await supabase
        .from('mining_licenses')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
      
      if (!licenseError && licenseData) {
        activities.push(...licenseData.map(license => ({
          id: `license_${license.id}`,
          type: 'license_activity',
          title: `License ${license.status || 'updated'}`,
          description: `${license.company_name || 'Unknown company'} - ${license.license_type || 'Mining license'}`,
          location: `${license.region || ''} ${license.district || ''}`.trim() || 'Unknown location',
          created_at: license.updated_at || license.created_at,
          metadata: {
            companyName: license.company_name,
            licenseType: license.license_type,
            status: license.status,
            region: license.region,
            district: license.district
          }
        })));
      }
      
      // Sort all activities by date and take the most recent 15
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);
      
      setRecentActivities(sortedActivities);
      setLastUpdated(new Date());
      
      // Cache the activities
      localStorage.setItem('dashboardActivities', JSON.stringify(sortedActivities));
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch mining reports count and data
      const { data: miningReportsData, count: miningReports } = await supabase
        .from('mining_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Fetch satellite reports count and data
      const { data: satelliteReportsData, count: satelliteReports, error: satelliteError } = await supabase
        .from('satellite_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (satelliteError) {
        console.error('Error fetching satellite reports:', satelliteError);
      }

      // Fetch mining licenses count and data (same table as License component)
      const { data: licenseData, count: licenseCount, error: licenseError } = await supabase
        .from('mining_licenses')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (licenseError) {
        console.error('Error fetching mining licenses:', licenseError);
      }

      // Debug logging
      console.log('Dashboard Data Fetch Results:');
      console.log('Mining Reports:', miningReports, miningReportsData?.length);
      console.log('Satellite Reports:', satelliteReports, satelliteReportsData?.length);
      console.log('Mining Licenses:', licenseCount, licenseData?.length);
      
      // Calculate active alerts from multiple sources (following useAlerts pattern)
      // 1. Satellite alerts - illegal mining detected
      const satelliteAlerts = (satelliteReportsData || []).filter(report => {
        const isIllegal = report.is_illegal === true || report.is_illegal === 'true';
        return isIllegal;
      }).length;
      
      // 2. Community alerts - all community reports are considered active
      const communityAlerts = miningReports || 0;
      
      // 3. System alerts - pending licenses and expired licenses
      const systemAlerts = (licenseData || []).filter(license => {
        const status = license.status?.toLowerCase() || 'unknown';
        return status === 'pending' || status === 'expired';
      }).length;
      
      // Total active alerts
      const activeAlerts = satelliteAlerts + communityAlerts + systemAlerts;
      
      console.log('Active Alerts Breakdown:');
      console.log('- Satellite Alerts (illegal mining):', satelliteAlerts);
      console.log('- Community Alerts:', communityAlerts);
      console.log('- System Alerts (pending/expired licenses):', systemAlerts);
      console.log('- Total Active Alerts:', activeAlerts);

      // Get recent activity from all sources
      const recentReports = (miningReportsData || []).slice(0, 5);
      const recentSatellite = (satelliteReportsData || []).slice(0, 3);
      const recentLicenses = (licenseData || []).slice(0, 3);

      // Calculate license status distribution
      const licenseStatusCounts = {
        active: 0,
        pending: 0,
        expired: 0,
        revoked: 0
      };

      (licenseData || []).forEach(license => {
        const status = license.status?.toLowerCase() || 'unknown';
        if (status in licenseStatusCounts) {
          licenseStatusCounts[status as keyof typeof licenseStatusCounts]++;
        }
      });

      // Calculate report types from both mining reports and satellite analysis
      const reportTypeCounts = {
        'Satellite Analysis': 0,
        'Community Reports': 0,
        'License Alerts': 0,
        'Illegal Mining': 0
      };

      // Count satellite reports by analysis type
      (satelliteReportsData || []).forEach(report => {
        reportTypeCounts['Satellite Analysis']++;
        if (report.is_illegal) {
          reportTypeCounts['Illegal Mining']++;
        }
      });

      // Count community reports
      reportTypeCounts['Community Reports'] = miningReports || 0;

      // Count license-related alerts (pending + expired)
      reportTypeCounts['License Alerts'] = systemAlerts;

      // Calculate weekly alerts (last 7 days) - all alert types
      const weeklyAlerts = [];
      const now = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dayName = dayNames[date.getDay()];
        let alertCount = 0;
        
        // Add satellite alerts (illegal mining)
        (satelliteReportsData || []).forEach(report => {
          if (report.is_illegal) {
            const reportDate = new Date(report.created_at);
            const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === i) {
              alertCount++;
            }
          }
        });
        
        // Add community reports
        (miningReportsData || []).forEach(report => {
          const reportDate = new Date(report.created_at);
          const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === i) {
            alertCount++;
          }
        });
        
        // Add license alerts (pending/expired in last 7 days)
        (licenseData || []).forEach(license => {
          const status = license.status?.toLowerCase() || 'unknown';
          if (status === 'pending' || status === 'expired') {
            const licenseDate = new Date(license.updated_at || license.created_at);
            const daysDiff = Math.floor((now.getTime() - licenseDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === i) {
              alertCount++;
            }
          }
        });
        
        weeklyAlerts.push({ day: dayName, alerts: alertCount });
      }

      // Calculate monthly trends (last 6 months) - comprehensive data
      const monthlyTrends = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Count community reports for this month
        const monthReports = (miningReportsData || []).filter(report => {
          const reportDate = new Date(report.created_at);
          return reportDate >= monthStart && reportDate <= monthEnd;
        }).length;
        
        // Count all alerts for this month (satellite + community + license)
        const monthSatelliteAlerts = (satelliteReportsData || []).filter(report => {
          const reportDate = new Date(report.created_at);
          return reportDate >= monthStart && reportDate <= monthEnd && report.is_illegal;
        }).length;
        
        const monthCommunityAlerts = monthReports; // All community reports are alerts
        
        const monthLicenseAlerts = (licenseData || []).filter(license => {
          const licenseDate = new Date(license.updated_at || license.created_at);
          const status = license.status?.toLowerCase() || 'unknown';
          return (status === 'pending' || status === 'expired') && 
                 licenseDate >= monthStart && licenseDate <= monthEnd;
        }).length;
        
        const monthAlerts = monthSatelliteAlerts + monthCommunityAlerts + monthLicenseAlerts;
        
        monthlyTrends.push({
          month: monthNames[date.getMonth()],
          reports: monthReports + (satelliteReportsData || []).filter(report => {
            const reportDate = new Date(report.created_at);
            return reportDate >= monthStart && reportDate <= monthEnd;
          }).length, // Include satellite reports in total reports
          alerts: monthAlerts
        });
      }

      const dashboardStats = {
        totalReports: miningReports || 0,
        totalLicenses: licenseCount || 0,
        activeAlerts: activeAlerts,
        satelliteAnalyses: satelliteReports || 0,
        recentActivity: [
          ...(recentReports || []).map(r => ({ ...r, type: 'mining_report' })),
          ...(recentSatellite || []).map(r => ({ ...r, type: 'satellite_report' })),
          ...(recentLicenses || []).map(r => ({ ...r, type: 'license' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8),
        chartData: {
          weeklyAlerts: weeklyAlerts,
          licenseStatus: [
            { status: 'Active', count: licenseStatusCounts.active, fill: '#10b981' },
            { status: 'Pending', count: licenseStatusCounts.pending, fill: '#f59e0b' },
            { status: 'Expired', count: licenseStatusCounts.expired, fill: '#ef4444' },
            { status: 'Revoked', count: licenseStatusCounts.revoked, fill: '#6b7280' }
          ],
          reportTypes: [
            { type: 'Satellite Analysis', count: reportTypeCounts['Satellite Analysis'], fill: '#3b82f6' },
            { type: 'Community Reports', count: reportTypeCounts['Community Reports'], fill: '#ef4444' },
            { type: 'License Alerts', count: reportTypeCounts['License Alerts'], fill: '#f59e0b' },
            { type: 'Illegal Mining', count: reportTypeCounts['Illegal Mining'], fill: '#dc2626' }
          ],
          monthlyTrends: monthlyTrends
        }
      };
      
      setStats(dashboardStats);
      setLastUpdated(new Date());
      
      // Cache the data
      const cacheTime = Date.now().toString();
      localStorage.setItem('dashboardStats', JSON.stringify(dashboardStats));
      localStorage.setItem('dashboardCacheTime', cacheTime);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    // Check if data is already cached
    const cachedStats = localStorage.getItem('dashboardStats');
    const cachedActivities = localStorage.getItem('dashboardActivities');
    const cacheTimestamp = localStorage.getItem('dashboardCacheTime');
    
    const isCacheValid = cacheTimestamp && 
      (Date.now() - parseInt(cacheTimestamp)) < 300000; // 5 minutes cache
    
    if (isCacheValid && cachedStats && cachedActivities) {
      // Use cached data
      setStats(JSON.parse(cachedStats));
      setRecentActivities(JSON.parse(cachedActivities));
      setLoading(false);
      setLastUpdated(new Date(parseInt(cacheTimestamp)));
    } else {
      // Fetch fresh data
      fetchDashboardData();
      fetchRecentActivities();
    }
    
    // No auto-refresh intervals - user can manually refresh if needed
  }, []);

  // Charts are now handled by Shadcn components - no initialization needed

  // Helper functions for activity display
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'satellite_analysis':
        return faSatellite;
      case 'community_report':
        return faFileAlt;
      case 'license_activity':
        return faIdCard;
      case 'mining_report':
        return faFileAlt;
      case 'satellite_report':
        return faSatellite;
      case 'license':
        return faIdCard;
      default:
        return faBell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'satellite_analysis':
        return 'bg-blue-100 text-blue-600';
      case 'community_report':
        return 'bg-red-100 text-red-600';
      case 'license_activity':
        return 'bg-green-100 text-green-600';
      case 'mining_report':
        return 'bg-red-100 text-red-600';
      case 'satellite_report':
        return 'bg-blue-100 text-blue-600';
      case 'license':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityTitle = (activity: any) => {
    if (activity.title) return activity.title;
    
    switch (activity.type) {
      case 'satellite_analysis':
        return 'Satellite analysis completed';
      case 'community_report':
        return 'Community mining report submitted';
      case 'license_activity':
        return `License ${activity.metadata?.status || 'updated'}`;
      case 'mining_report':
        return 'New mining report submitted';
      case 'satellite_report':
        return 'Satellite analysis completed';
      case 'license':
        return 'License application received';
      default:
        return 'System activity';
    }
  };

  const getActivityDescription = (activity: any) => {
    if (activity.description) return activity.description;
    
    switch (activity.type) {
      case 'satellite_analysis':
        return `${activity.metadata?.analysisType?.toUpperCase() || 'NDVI'} analysis${activity.metadata?.changeArea ? ` - ${activity.metadata.changeArea} hectares affected` : ''}`;
      case 'community_report':
        return `${activity.metadata?.reportType || 'Mining activity'} reported${activity.metadata?.reporterName ? ` by ${activity.metadata.reporterName}` : ''}`;
      case 'license_activity':
        return `${activity.metadata?.companyName || 'Company'} - ${activity.metadata?.licenseType || 'Mining license'}`;
      default:
        return activity.location || 'System activity';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      {/* Header Welcome Banner */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">Hello, Administrator!</h1>
            <p className="text-orange-100">Welcome back to GEOGUARD Mining Intelligence</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 right-4">
            <FontAwesomeIcon icon={faShieldAlt} className="text-6xl text-white opacity-20" />
          </div>
        </div>
      </div>
      
      {/* Date and Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-medium text-gray-600">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Badge className="bg-red-500 text-white text-xs">{stats?.activeAlerts || 0}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <FontAwesomeIcon icon={faClock} className="mr-2" />
            {currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Reports</p>
                <p className="text-3xl font-bold">{stats?.totalReports || 0}</p>
                <p className="text-blue-100 text-xs mt-1">+12% from last month</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-300 rounded-xl shadow-lg flex items-center justify-center">
                <HiDocumentReport className="text-2xl text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Active Alerts</p>
                <p className="text-3xl font-bold">{stats?.activeAlerts || 0}</p>
                <p className="text-red-100 text-xs mt-1">-5% from last week</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-400 to-red-300 rounded-xl shadow-lg flex items-center justify-center">
                <FiAlertTriangle className="text-2xl text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Licenses</p>
                <p className="text-3xl font-bold">{stats?.totalLicenses || 0}</p>
                <p className="text-green-100 text-xs mt-1">+8% from last month</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-300 rounded-xl shadow-lg flex items-center justify-center">
                <MdVerifiedUser className="text-2xl text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Satellite Data</p>
                <p className="text-3xl font-bold">{stats?.satelliteAnalyses || 0}</p>
                <p className="text-purple-100 text-xs mt-1">Real-time monitoring</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-300 rounded-xl shadow-lg flex items-center justify-center">
                <MdSatellite className="text-2xl text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Mining Concessions Map */}
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Mining Concessions Map</CardTitle>
                <CardDescription>Overview of registered mining concessions in Ghana</CardDescription>
              </div>
          
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] rounded-b-lg overflow-hidden">
              <ConcessionsMap />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest reports and system updates</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecentActivities}
                disabled={activitiesLoading}
                className="h-8 px-2"
              >
                <FontAwesomeIcon 
                  icon={faSync} 
                  className={`h-3 w-3 ${activitiesLoading ? 'animate-spin' : ''}`} 
                />
              </Button>
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[360px] px-6">
              <div className="space-y-4 py-4">
                {activitiesLoading && recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <FontAwesomeIcon icon={faSync} className="animate-spin h-5 w-5 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading activities...</span>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-gray-500">No recent activities found</span>
                  </div>
                ) : (
                  recentActivities.slice(0, 8).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                        <FontAwesomeIcon icon={getActivityIcon(activity.type)} className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getActivityTitle(activity)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {getActivityDescription(activity)}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            📍 {activity.location || 'Unknown location'}
                          </p>
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {new Date(activity.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {activity.metadata?.isIllegal && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            Illegal Mining Detected
                          </Badge>
                        )}
                        {activity.metadata?.severity && (
                          <Badge 
                            variant={activity.metadata.severity === 'high' ? 'destructive' : 
                                   activity.metadata.severity === 'medium' ? 'default' : 'secondary'} 
                            className="mt-1 text-xs"
                          >
                            {activity.metadata.severity.toUpperCase()} Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* License Status Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">License Status</CardTitle>
            <CardDescription>Distribution of mining licenses by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Licenses" },
                Active: { label: "Active", color: "#10b981" },
                Pending: { label: "Pending", color: "#f59e0b" },
                Expired: { label: "Expired", color: "#ef4444" },
                Revoked: { label: "Revoked", color: "#6b7280" }
              } satisfies ChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={stats?.chartData?.licenseStatus || []}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={2}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = stats?.chartData?.licenseStatus?.reduce((sum, item) => sum + item.count, 0) || 0;
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-sm"
                            >
                              Licenses
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#10b981]"></div>
                <span>Active: {stats?.chartData?.licenseStatus?.find(item => item.status === 'Active')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#f59e0b]"></div>
                <span>Pending: {stats?.chartData?.licenseStatus?.find(item => item.status === 'Pending')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
                <span>Expired: {stats?.chartData?.licenseStatus?.find(item => item.status === 'Expired')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#6b7280]"></div>
                <span>Revoked: {stats?.chartData?.licenseStatus?.find(item => item.status === 'Revoked')?.count || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Weekly Alerts Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Weekly Alerts</CardTitle>
            <CardDescription>Number of alerts generated this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                alerts: {
                  label: "Alerts",
                  color: "#3b82f6",
                },
              } satisfies ChartConfig}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData?.weeklyAlerts || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="alerts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Report Types Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Report Types</CardTitle>
            <CardDescription>Distribution of different report categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Reports" },
                "Satellite Analysis": { label: "Satellite Analysis", color: "#3b82f6" },
                "Community Reports": { label: "Community Reports", color: "#ef4444" },
                "License Alerts": { label: "License Alerts", color: "#f59e0b" },
                "Illegal Mining": { label: "Illegal Mining", color: "#dc2626" }
              } satisfies ChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={stats?.chartData?.reportTypes || []}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={2}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = stats?.chartData?.reportTypes?.reduce((sum, item) => sum + item.count, 0) || 0;
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-sm"
                            >
                              Reports
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#3b82f6]"></div>
                <span>Satellite: {stats?.chartData?.reportTypes?.find(item => item.type === 'Satellite Analysis')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
                <span>Community: {stats?.chartData?.reportTypes?.find(item => item.type === 'Community Reports')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#f59e0b]"></div>
                <span>License: {stats?.chartData?.reportTypes?.find(item => item.type === 'License Alerts')?.count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#dc2626]"></div>
                <span>Illegal Mining: {stats?.chartData?.reportTypes?.find(item => item.type === 'Illegal Mining')?.count || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Trends Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Monthly Trends</CardTitle>
            <CardDescription>Reports and alerts over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                reports: {
                  label: "Reports",
                  color: "#3b82f6",
                },
                alerts: {
                  label: "Alerts",
                  color: "#ef4444",
                },
              } satisfies ChartConfig}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.chartData?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="reports" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

     
      

      
    </div>
  );
};

export default Dashboard;
