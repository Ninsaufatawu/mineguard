import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import General from "./General";
import Account from "./Account";
import Notifications from "./Notifications";
import Security from "./Security";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faSlidersH, 
  faUserShield, 
  faBell, 
  faPlug, 
  faLock, 
  faCogs 
} from '@fortawesome/free-solid-svg-icons';

const Settings: React.FC = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <Button className="!rounded-button cursor-pointer whitespace-nowrap">
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'general', label: 'General', icon: faSlidersH },
                { id: 'account', label: 'Account', icon: faUserShield },
                { id: 'notifications', label: 'Notifications', icon: faBell },
                { id: 'security', label: 'Security', icon: faLock },
                
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`px-6 py-4 text-sm font-medium flex items-center border-b-2 ${
                    activeSettingsTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSettingsTab(tab.id)}
                >
                  <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {activeSettingsTab === 'general' && <General />}
            {activeSettingsTab === 'account' && <Account />}
            {activeSettingsTab === 'notifications' && <Notifications />}
            {activeSettingsTab === 'security' && <Security />}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 