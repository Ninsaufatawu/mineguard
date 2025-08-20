import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AlertStats } from './types';

interface AlertFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  stats: AlertStats;
}

const AlertFilters: React.FC<AlertFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  onRefresh,
  refreshing,
  stats
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <Input
            placeholder="Search alerts by description, location, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources ({stats.total})</SelectItem>
              <SelectItem value="satellite">Satellite ({stats.satellite})</SelectItem>
              <SelectItem value="community">Community ({stats.community})</SelectItem>
              <SelectItem value="system">System ({stats.system})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <FontAwesomeIcon 
            icon={refreshing ? faSpinner : faRefresh} 
            className={refreshing ? "animate-spin" : ""} 
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
};

export default AlertFilters;
