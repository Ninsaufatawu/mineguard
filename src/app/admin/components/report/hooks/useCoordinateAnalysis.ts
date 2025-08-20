import { useState, useCallback } from 'react';

export interface CoordinateAnalysisRequest {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  analysisType: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE';
  detectionThreshold: number;
  reportId?: string;
}

export interface CoordinateAnalysisReport {
  id?: string;
  latitude: number;
  longitude: number;
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
  locationName?: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  environmentalImpact: {
    vegetationLoss: number;
    soilExposure: number;
    waterContamination: string;
    severity: string;
  };
  createdAt: string;
}

interface UseCoordinateAnalysisReturn {
  loading: boolean;
  error: string | null;
  data: CoordinateAnalysisReport | null;
  runAnalysis: (params: CoordinateAnalysisRequest) => Promise<void>;
  reset: () => void;
}

export const useCoordinateAnalysis = (): UseCoordinateAnalysisReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CoordinateAnalysisReport | null>(null);

  const runAnalysis = useCallback(async (params: CoordinateAnalysisRequest) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      console.log('🎯 Running coordinate analysis:', params);

      const response = await fetch('/api/analyze-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Coordinate analysis completed:', result);
      
      setData(result);
    } catch (err) {
      console.error('❌ Coordinate analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
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
};
