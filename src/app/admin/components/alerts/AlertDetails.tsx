import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faBolt } from '@fortawesome/free-solid-svg-icons';
import { Alert } from './types';

interface AlertDetailsProps {
  alert: Alert;
  onExportPDF: (alert: Alert) => void;
  onTakeAction: (alert: Alert) => void;
  onClose: () => void;
}

const AlertDetails: React.FC<AlertDetailsProps> = ({
  alert,
  onExportPDF,
  onTakeAction,
  onClose
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 border-t">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Alert Information</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Alert ID:</span>
              <span className="text-sm font-medium">{alert.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Source:</span>
              <Badge variant="outline">{alert.source}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Priority:</span>
              <Badge className={getPriorityColor(alert.priority)}>
                {alert.priority}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={getStatusColor(alert.status)}>
                {alert.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date/Time:</span>
              <span className="text-sm">{alert.datetime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Location:</span>
              <span className="text-sm">{alert.location}</span>
            </div>
            {alert.analysis_type && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Analysis Type:</span>
                <span className="text-sm">{alert.analysis_type}</span>
              </div>
            )}
            {alert.change_area_km2 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Change Area:</span>
                <span className="text-sm">{alert.change_area_km2.toFixed(2)} km²</span>
              </div>
            )}
            {(alert.latitude && alert.longitude) && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coordinates:</span>
                <span className="text-sm">{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Satellite Images */}
        {(alert.before_image_url || alert.after_image_url) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Satellite Images</h4>
            <div className="grid grid-cols-2 gap-4">
              {alert.before_image_url && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Before Analysis</p>
                  <img 
                    src={alert.before_image_url} 
                    alt="Before" 
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => window.open(alert.before_image_url, '_blank')}
                  />
                </div>
              )}
              {alert.after_image_url && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">After Analysis</p>
                  <img 
                    src={alert.after_image_url} 
                    alt="After" 
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => window.open(alert.after_image_url, '_blank')}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportPDF(alert)}
          >
            <FontAwesomeIcon icon={faFileExport} className="mr-2" />
            Export PDF
          </Button>
          
          <Button 
            size="sm"
            onClick={() => onTakeAction(alert)}
          >
            <FontAwesomeIcon icon={faBolt} className="mr-2" />
            Take Action
          </Button>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose}
        >
          Close Details
        </Button>
      </div>
    </div>
  );
};

export default AlertDetails;
