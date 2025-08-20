export interface AlertsProps {
  setActiveTab?: (tab: string) => void;
}

export interface Alert {
  id: string;
  description: string;
  location: string;
  source: 'Satellite' | 'Report' | 'System';
  datetime: string;
  status: 'new' | 'in-progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  district?: string;
  analysis_type?: string;
  is_illegal?: boolean;
  change_area_km2?: number;
  before_image_url?: string;
  after_image_url?: string;
  latitude?: number;
  longitude?: number;
}

export interface AlertStats {
  total: number;
  satellite: number;
  community: number;
  system: number;
  highPriority: number;
  newAlerts: number;
}
