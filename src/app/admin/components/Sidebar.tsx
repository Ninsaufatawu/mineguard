import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faMap, 
  faSatellite, 
  faFileAlt, 
  faIdCard, 
  faBell, 
  faCog,
  faShieldAlt,
  faGlobe,
  faBars,
  faSignOutAlt,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  progress: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, progress }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: faTachometerAlt, label: 'Dashboard' },
    { id: 'satellite', icon: faSatellite, label: 'Satellite Analysis' },
    { id: 'reports', icon: faFileAlt, label: 'Reports' },
    { id: 'licenses', icon: faIdCard, label: 'Licenses' },
    { id: 'alerts', icon: faBell, label: 'Alerts' },
    { id: 'settings', icon: faCog, label: 'Settings' }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} relative flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Curved Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-green-800">
        {/* Extended curved area */}
        <div className="absolute top-0 right-0 h-full w-16">
          <svg 
            className="h-full w-full" 
            viewBox="0 0 64 100" 
            preserveAspectRatio="none"
          >
            
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#065f46" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with GEOGUARD branding */}
        <div className="p-6 border-b border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faShieldAlt} className="text-green-600 text-lg" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">GEOGUARD</h1>
                  <p className="text-xs text-green-200 font-medium">Mining Intelligence</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <div className="space-y-2">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative">
                  {/* Curved background for active item */}
                  {isActive && !isCollapsed && (
                    <div className="absolute inset-0 -right-8">
                      <div className="relative h-full">
                        {/* Main background */}
                        <div className="absolute inset-0 bg-white rounded-l-xl " />
                        
                        
                      </div>
                    </div>
                  )}
                  
                  {/* Curved background for active item when collapsed */}
                  {isActive && isCollapsed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm" />
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    className={`relative z-10 w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 h-auto transition-all duration-200 group ${
                      isActive 
                        ? 'text-green-600 font-semibold' 
                        : 'text-green-100 hover:text-white hover:bg-white/10 rounded-xl'
                    }`}
                    onClick={() => setActiveTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} flex items-center justify-center transition-all duration-200`}>
                      <FontAwesomeIcon icon={item.icon} className="text-base" />
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium text-sm truncate">{item.label}</span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* System Status - only show when expanded */}
        {!isCollapsed && (
          <div className="p-4 border-t border-green-500/20">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse" />
                  System Status
                </h4>
                <Badge className="bg-green-300/20 text-green-100 border-green-300/30 text-xs px-2 py-1">
                  Online
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-200">Satellite Data</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                    <span className="text-xs text-green-100 font-medium">Live</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-200">Storage</span>
                  <span className="text-xs text-green-100 font-medium">{progress}%</span>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={progress} 
                    className="h-2 bg-green-700 rounded-full overflow-hidden"
                  />
                  <div 
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-300 to-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

       

        {/* Sidebar Toggle Button */}
        <div className="p-4 border-t border-green-500/20">
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 h-auto rounded-xl text-green-100 hover:text-white hover:bg-white/10 transition-all duration-200`}
            title={isCollapsed ? (isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar') : undefined}
          >
            <div className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} flex items-center justify-center`}>
              <FontAwesomeIcon 
                icon={isCollapsed ? faChevronRight : faChevronLeft} 
                className="text-base" 
              />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm">
                {isCollapsed ? 'Expand' : 'Collapse'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 