import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle,
  faSatellite,
  faUsers,
  faFileContract
} from '@fortawesome/free-solid-svg-icons';
import { AlertStats as AlertStatsType } from './types';

interface AlertStatsProps {
  stats: AlertStatsType;
  loading: boolean;
}

const AlertStats: React.FC<AlertStatsProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card className="bg-red-50 border-red-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-red-800">Total Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-red-800">{loading ? '...' : stats.total}</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                <span>All alert sources</span>
              </p>
            </div>
            <div className="h-12 w-12 bg-red-200 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-yellow-50 border-yellow-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-yellow-800">Satellite Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-800">{loading ? '...' : stats.satellite}</p>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <FontAwesomeIcon icon={faSatellite} className="mr-1" />
                <span>From satellite analysis</span>
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faSatellite} className="text-yellow-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-blue-800">Community Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-800">{loading ? '...' : stats.community}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <FontAwesomeIcon icon={faUsers} className="mr-1" />
                <span>From community</span>
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-purple-50 border-purple-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-purple-800">License Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-800">{loading ? '...' : stats.system}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <FontAwesomeIcon icon={faFileContract} className="mr-1" />
                <span>License alerts</span>
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faFileContract} className="text-purple-600 text-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertStats;
