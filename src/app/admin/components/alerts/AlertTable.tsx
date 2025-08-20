import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { Alert } from './types';
import AlertDetails from './AlertDetails';

interface AlertTableProps {
  alerts: Alert[];
  expandedAlertId: string | null;
  onToggleExpanded: (alertId: string) => void;
  onExportPDF: (alert: Alert) => void;
  onTakeAction: (alert: Alert) => void;
}

const AlertTable: React.FC<AlertTableProps> = ({
  alerts,
  expandedAlertId,
  onToggleExpanded,
  onExportPDF,
  onTakeAction
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

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Satellite': return 'bg-blue-100 text-blue-800';
      case 'Report': return 'bg-green-100 text-green-800';
      case 'System': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No alerts found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alert ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Date/Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <React.Fragment key={alert.id}>
              <TableRow 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onToggleExpanded(alert.id)}
              >
                <TableCell className="font-medium">{alert.id}</TableCell>
                <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                <TableCell>{alert.location}</TableCell>
                <TableCell>
                  <Badge className={getSourceColor(alert.source)}>
                    {alert.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{alert.datetime}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(alert.priority)}>
                    {alert.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpanded(alert.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-2" />
                    {expandedAlertId === alert.id ? 'Hide' : 'View'}
                  </Button>
                </TableCell>
              </TableRow>
              
              {expandedAlertId === alert.id && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <AlertDetails
                      alert={alert}
                      onExportPDF={onExportPDF}
                      onTakeAction={onTakeAction}
                      onClose={() => onToggleExpanded(alert.id)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AlertTable;
