import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt,faSatellite, faFileAlt,faIdCard, faBell,faCog } from '@fortawesome/free-solid-svg-icons';
import { useNotificationContext } from './alerts/NotificationContext';
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface TopbarProps {
  syncStatus: string;
  onNotificationClick?: () => void;
  currentPage?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'super_admin';
  status: string;
  profile_image_url?: string;
  department?: string;
}

const Topbar: React.FC<TopbarProps> = ({ syncStatus, onNotificationClick, currentPage = 'Dashboard' }) => {
  const { notifications, loading } = useNotificationContext();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(true);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch fresh admin user data from database (not just JWT token)
  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          console.log('No admin token found');
          setLoadingAdminData(false);
          router.push('/admin/login');
          return;
        }

        // Decode JWT token to get user ID and check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('Admin token expired');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          router.push('/admin/login');
          return;
        }

        // Fetch fresh admin data from database using user ID from token
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('id, name, email, role, status, profile_image_url, department')
          .eq('id', payload.userId)
          .single();

        if (error) {
          console.error('Error fetching admin user:', error);
          // Fallback to token data if database fetch fails
          const fallbackData: AdminUser = {
            id: payload.userId,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            status: 'active',
            profile_image_url: payload.profile_image_url,
            department: payload.department
          };
          setAdminUser(fallbackData);
        } else {
          // Use fresh data from database
          setAdminUser(adminData);
          console.log('Fresh admin user data loaded:', adminData);
        }
      } catch (error) {
        console.error('Error parsing admin token:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin/login');
      } finally {
        setLoadingAdminData(false);
      }
    };

    fetchAdminUser();
  }, [router]);

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleLogout = () => {
    try {
      setIsLoggingOut(true);
      console.log('Logging out admin user...');
      
      // Remove admin token from localStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      
      // Redirect to admin login page
      router.push('/admin/login');
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  // Extract user information from JWT token admin data
  const userName = adminUser?.name ?? "Admin User";
  const userEmail = adminUser?.email ?? "admin@geoguard.com";
  const userImage = adminUser?.profile_image_url ?? "";
  const userRole = adminUser?.role ? 
    (adminUser.role === 'admin' ? 'Administrator' : 
     adminUser.role === 'moderator' ? 'Moderator' : 'Admin') : 'Administrator';
  const userDepartment = adminUser?.department;

  // Debug logging
  console.log('Admin user from token:', adminUser);
  console.log('Loading admin data:', loadingAdminData);
  console.log('Final user values:', { userName, userEmail, userRole, userDepartment });

  // Get initials for avatar fallback
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  // Helper function to get page icon
  const getPageIcon = (page: string) => {
    switch (page.toLowerCase()) {
      case 'dashboard':
        return faTachometerAlt;
      case 'satellite analysis':
      case 'satellite':
        return faSatellite;
      case 'reports':
      case 'report':
        return faFileAlt;
      case 'licenses':
      case 'license':
        return faIdCard;
      case 'alerts':
      case 'alert':
        return faBell;
      case 'settings':
        return faCog;
      default:
        return faTachometerAlt;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      
      {/* Page Location Indicator */}
      <div className="flex-1 flex items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <FontAwesomeIcon 
              icon={getPageIcon(currentPage)} 
              className="text-blue-600 w-4 h-4" 
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
            
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
            syncStatus === 'connected' ? 'bg-green-500' :
            syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></span>
          <span className="text-sm text-gray-600">
            {syncStatus === 'connected' ? 'Connected' :
             syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}
          </span>
        </div>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="!rounded-button cursor-pointer relative hover:bg-blue-50 transition-colors"
            onClick={handleNotificationClick}
            title={`${notifications.unvisitedAlerts} unvisited alerts, ${notifications.newAlerts} new`}
          >
            <FontAwesomeIcon 
              icon={faBell} 
              className={`transition-colors ${
                notifications.unvisitedAlerts > 0 ? 'text-red-600' : 'text-gray-600'
              }`} 
            />
            {!loading && notifications.unvisitedAlerts > 0 && (
              <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
                notifications.unvisitedAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
              }`}>
                {notifications.unvisitedAlerts > 99 ? '99+' : notifications.unvisitedAlerts}
              </span>
            )}
          </Button>
        </div>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userImage} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-gray-900">{userName}</p>
                <p className="text-xs leading-none text-gray-500">{userEmail}</p>
                <p className="text-xs leading-none text-gray-400">{userRole}</p>
                {userDepartment && (
                  <p className="text-xs leading-none text-gray-400">{userDepartment}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-600 cursor-pointer"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar; 