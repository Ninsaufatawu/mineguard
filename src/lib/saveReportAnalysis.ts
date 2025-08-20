import { supabase } from './supabase';

export interface SaveAnalysisParams {
  report_id: string;
  analysis_type: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE';
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  is_illegal: boolean;
  confidence: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  affected_area?: number;
  location_name?: string;
  environmental_impact: {
    vegetationLoss: number;
    soilExposure: number;
    waterContamination: string;
    severity: string;
  };
  vegetation_loss_percent?: number;
  bare_soil_increase_percent?: number;
  water_turbidity?: string;
  before_image_url?: string;
  after_image_url?: string;
  ndvi_image_url?: string;
  geojson_url?: string;
}

export async function saveReportAnalysis(params: SaveAnalysisParams): Promise<string | null> {
  try {
    console.log('💾 Saving satellite analysis result to database:', params);

    const { data, error } = await supabase.rpc('save_satellite_analysis_result', {
      p_report_id: params.report_id,
      p_analysis_type: params.analysis_type,
      p_latitude: params.latitude,
      p_longitude: params.longitude,
      p_start_date: params.start_date,
      p_end_date: params.end_date,
      p_is_illegal: params.is_illegal,
      p_confidence: params.confidence,
      p_risk_level: params.risk_level,
      p_affected_area: params.affected_area || 1.0,
      p_location_name: params.location_name,
      p_environmental_impact: params.environmental_impact,
      p_vegetation_loss_percent: params.vegetation_loss_percent,
      p_bare_soil_increase_percent: params.bare_soil_increase_percent,
      p_water_turbidity: params.water_turbidity,
      p_before_image_url: params.before_image_url,
      p_after_image_url: params.after_image_url,
      p_ndvi_image_url: params.ndvi_image_url,
      p_geojson_url: params.geojson_url
    });

    if (error) {
      console.error('❌ Error saving analysis result:', error);
      throw error;
    }

    console.log('✅ Analysis result saved successfully with ID:', data);
    return data;
  } catch (error) {
    console.error('💥 Failed to save analysis result:', error);
    return null;
  }
}

export async function getReportAnalysisResults() {
  try {
    console.log('📊 Fetching satellite analysis results from database');

    const { data, error } = await supabase.rpc('get_satellite_analysis_with_report_data');

    if (error) {
      console.error('❌ Error fetching analysis results:', error);
      throw error;
    }

    console.log('✅ Fetched analysis results:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('💥 Failed to fetch analysis results:', error);
    return [];
  }
}

export async function getAnalysisResultsByReportId(reportId: string) {
  try {
    console.log('📊 Fetching analysis results for report:', reportId);

    const { data, error } = await supabase
      .from('satellite_analysis_results')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching analysis results for report:', error);
      throw error;
    }

    console.log('✅ Fetched analysis results for report:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('💥 Failed to fetch analysis results for report:', error);
    return [];
  }
}
