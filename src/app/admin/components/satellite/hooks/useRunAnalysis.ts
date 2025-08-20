import { useState, useCallback } from 'react';

export interface AnalysisRequest {
  district: string;
  startDate: string;
  endDate: string;
  analysisType: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE';
  detectionThreshold: number;
  // Sequential location tracking
  locationSequence?: number; // Track which location in sequence (1, 2, 3, etc.)
  forceNewLocation?: boolean; // Force selection of a new location
}

export interface AnalysisReport {
  id?: string;
  district: string;
  startDate: string;
  endDate: string;
  analysisType: string;
  vegetationLossPercent?: number;
  bareSoilIncreasePercent?: number;
  waterTurbidity?: string;
  isIllegal: boolean;
  illegalAreaKm2: number;
  beforeImageURL: string;
  afterImageURL: string;
  ndviImageURL: string;
  geojsonURL: string;
  // Geographic coordinates and area information
  centerLatitude?: number;
  centerLongitude?: number;
  totalAreaKm2?: number;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  // Current location tracking for sequential analysis
  currentLocation?: {
    locationId: string; // Unique ID for this location (LOC-001, LOC-002, etc.)
    locationName: string; // Descriptive name of the location
    sequenceNumber: number; // Which location in sequence (1, 2, 3, etc.)
    coordinates: {
      latitude: number;
      longitude: number;
      dms: string; // Degrees, minutes, seconds format
      utm: string; // UTM coordinates
    };
    areaSize: {
      km2: number;
      m2: number;
    };
    locationBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  detectedSubAreas?: Array<{
    subAreaId: string;
    location_name: string;
    center_latitude: number;
    center_longitude: number;
    area_km2: number;
    area_m2: number;
    coordinates_dms: string;
    utm_coordinates: string;
    priority: string;
    detection_confidence: string;
    zone_type: string;
    legal_status: string;
    boundingBox: any;
    analysisTimestamp: string;
  }>;
  createdAt: string;
}

export interface UseRunAnalysisReturn {
  loading: boolean;
  error: string | null;
  data: AnalysisReport | null;
  runAnalysis: (params: AnalysisRequest) => Promise<void>;
  reset: () => void;
}

export function useRunAnalysis(): UseRunAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisReport | null>(null);

  const runAnalysis = useCallback(async (params: AnalysisRequest) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const response = await fetch('/api/run-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }

      const result: AnalysisReport = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    runAnalysis,
    reset,
  };
}

// Hook for fetching reports
export interface UseReportsReturn {
  loading: boolean;
  error: string | null;
  reports: any[];
  summary: any;
  fetchReports: (filters?: any) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReports(initialFilters?: any): UseReportsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [currentFilters, setCurrentFilters] = useState(initialFilters || {});

  const fetchReports = useCallback(async (filters = currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/reports?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch reports');
      }

      const result = await response.json();
      setReports(result.reports || []);
      setSummary(result.summary || {});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const refresh = useCallback(() => fetchReports(currentFilters), [fetchReports, currentFilters]);

  return {
    loading,
    error,
    reports,
    summary,
    fetchReports,
    refresh,
  };
}
