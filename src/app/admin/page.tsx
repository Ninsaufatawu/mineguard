"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { useAdminAuth } from "./hooks/useAdminAuth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Satellite from "./components/Satellite";
import Reports from "./components/report/Reports";
import License from "./components/license";
import Alerts from "./components/Alerts";
import Settings from "./components/settings";
import { NotificationProvider } from "./components/alerts/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mapView, setMapView] = useState("satellite");
  const [dateRange, setDateRange] = useState([60]);
  const [progress, setProgress] = useState(66);
  const [syncStatus, setSyncStatus] = useState("connected");
  const [darkMode, setDarkMode] = useState(false);
  
  const { user, isSuperAdmin } = useAdminAuth();
  const router = useRouter();

  // Redirect super admins to their dedicated dashboard
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      router.push('/admin/super-admin');
    }
  }, [user, router]);

  const handleNotificationClick = () => {
    setActiveTab("alerts");
  };

  // Helper function to get page display name
  const getPageDisplayName = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'satellite': return 'Satellite Analysis';
      case 'reports': return 'Reports';
      case 'licenses': return 'Licenses';
      case 'alerts': return 'Alerts';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <AdminProtectedRoute>
      <NotificationProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            progress={progress}
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Topbar 
              syncStatus={syncStatus} 
              onNotificationClick={handleNotificationClick}
              currentPage={getPageDisplayName(activeTab)}
            />
            <main className="flex-1 overflow-y-auto">
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "satellite" && <Satellite />}
              {activeTab === "reports" && <Reports />}
              {activeTab === "licenses" && <License />}
              {activeTab === "alerts" && <Alerts setActiveTab={setActiveTab} />}
              {activeTab === "settings" && <Settings />}
            </main>
          </div>
        </div>
      </NotificationProvider>
    </AdminProtectedRoute>
  );
}
