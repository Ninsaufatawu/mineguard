"use client";

import React, { useState, useEffect } from 'react';
import { AlertsProps } from './alerts/types';
import AlertStats from './alerts/AlertStats';
import AlertFilters from './alerts/AlertFilters';
import AlertTable from './alerts/AlertTable';
import { useAlerts } from './alerts/useAlerts';
import { useNotificationContext } from './alerts/NotificationContext';
import { filterAlerts, handleExportPDF, handleTakeAction } from './alerts/alertUtils';

const Alerts: React.FC<AlertsProps> = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // Use the custom hook for alert data
  const { alerts, stats, loading, error, refreshing, handleRefresh } = useAlerts();
  
  // Use the shared notification context to mark alerts as visited
  const { markAlertsAsVisited } = useNotificationContext();

  // Filter alerts based on search and filter criteria
  const filteredAlerts = filterAlerts(alerts, searchQuery, filterType);

  // Handle expanding/collapsing alert details
  const toggleExpandedAlert = (alertId: string) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
  };

  // Handle PDF export
  const onExportPDF = (alert: any) => {
    handleExportPDF(alert);
  };

  // Handle take action
  const onTakeAction = (alert: any) => {
    handleTakeAction(alert, setActiveTab);
  };

  // Mark alerts as visited when component mounts
  useEffect(() => {
    console.log('📋 Alerts component mounted - marking alerts as visited');
    markAlertsAsVisited();
  }, [markAlertsAsVisited]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mining Alerts</h1>
        <p className="text-gray-600">Monitor and manage mining-related alerts from various sources</p>
      </div>

      {/* Alert Statistics */}
      <AlertStats stats={stats} loading={loading} />

      {/* Alert Filters */}
      <AlertFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        stats={stats}
      />

      {/* Alert Table */}
      <AlertTable
        alerts={filteredAlerts}
        expandedAlertId={expandedAlertId}
        onToggleExpanded={toggleExpandedAlert}
        onExportPDF={onExportPDF}
        onTakeAction={onTakeAction}
      />

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading alerts...</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
