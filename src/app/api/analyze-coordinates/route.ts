import { NextRequest, NextResponse } from 'next/server';
import { runSentinelAnalysis } from '../../admin/components/satellite/lib/gee';
import { uploadToSupabase } from '../../admin/components/satellite/lib/storage';
import { saveReportAnalysis } from '../../../lib/saveReportAnalysis';

export interface CoordinateAnalysisRequest {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  analysisType: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE';
  detectionThreshold: number;
  reportId?: string; // Optional report ID for tracking
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
  environmentalImpact: {
    vegetationLoss: number;
    soilExposure: number;
    waterContamination: string;
    severity: string;
  };
  createdAt: string;
}

// Helper function to create AOI from coordinates
function createCoordinateAOI(latitude: number, longitude: number, radiusKm: number = 1): GeoJSON.Feature {
  // Create a square AOI around the coordinates
  const kmToDegrees = 1 / 111.32; // Approximate conversion
  const radius = radiusKm * kmToDegrees;
  
  const coordinates = [[
    [longitude - radius, latitude - radius],
    [longitude + radius, latitude - radius],
    [longitude + radius, latitude + radius],
    [longitude - radius, latitude + radius],
    [longitude - radius, latitude - radius]
  ]];

  return {
    type: 'Feature',
    properties: {
      name: `Analysis_Area_${latitude.toFixed(6)}_${longitude.toFixed(6)}`,
      center_lat: latitude,
      center_lng: longitude,
      radius_km: radiusKm
    },
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    }
  };
}

// Helper function to determine if mining activity is illegal based on vegetation loss
function analyzeCoordinateLegality(
  latitude: number, 
  longitude: number, 
  vegetationLoss: number,
  bareSoilIncrease: number
): {
  isIllegal: boolean;
  confidence: number;
  locationName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  environmentalImpact: {
    vegetationLoss: number;
    soilExposure: number;
    waterContamination: string;
    severity: string;
  };
} {
  // Determine location name based on coordinates
  let locationName = "Unknown Location";
  
  // Western Region (high mining activity)
  if (latitude >= 4.5 && latitude <= 6.5 && longitude >= -3.5 && longitude <= -1.5) {
    locationName = "Western Region Mining Area";
    
    // Tarkwa-Nsuaem area (very high risk)
    if (latitude >= 5.0 && latitude <= 5.8 && longitude >= -2.2 && longitude <= -1.8) {
      locationName = "Tarkwa-Nsuaem Gold Mining District";
    }
  }
  // Ashanti Region
  else if (latitude >= 6.0 && latitude <= 7.5 && longitude >= -2.5 && longitude <= -0.5) {
    locationName = "Ashanti Region Mining Area";
    
    // Obuasi area
    if (latitude >= 6.1 && latitude <= 6.3 && longitude >= -1.8 && longitude <= -1.6) {
      locationName = "Obuasi Gold Mining District";
    }
  }
  
  // IMPROVED LEGALITY ANALYSIS BASED ON VEGETATION LOSS THRESHOLDS
  let isIllegal = false;
  let confidence = 0;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Vegetation loss thresholds for illegal mining detection
  if (vegetationLoss >= 70) {
    // Critical vegetation loss - definitely illegal mining
    isIllegal = true;
    confidence = 95;
    riskLevel = 'critical';
  } else if (vegetationLoss >= 50) {
    // High vegetation loss - likely illegal mining
    isIllegal = true;
    confidence = 85;
    riskLevel = 'high';
  } else if (vegetationLoss >= 30) {
    // Moderate vegetation loss - possible illegal mining (check soil exposure)
    if (bareSoilIncrease >= 40) {
      isIllegal = true;
      confidence = 75;
      riskLevel = 'high';
    } else {
      isIllegal = false;
      confidence = 60;
      riskLevel = 'medium';
    }
  } else if (vegetationLoss >= 15) {
    // Low vegetation loss - likely legal mining or natural causes
    if (bareSoilIncrease >= 60) {
      // High soil exposure might indicate illegal mining
      isIllegal = true;
      confidence = 65;
      riskLevel = 'medium';
    } else {
      isIllegal = false;
      confidence = 70;
      riskLevel = 'low';
    }
  } else {
    // Very low vegetation loss - likely legal or no mining activity
    isIllegal = false;
    confidence = 80;
    riskLevel = 'low';
  }
  
  // Environmental impact assessment
  const environmentalImpact = {
    vegetationLoss: Math.round(vegetationLoss),
    soilExposure: Math.round(bareSoilIncrease),
    waterContamination: bareSoilIncrease > 50 ? "High" : bareSoilIncrease > 25 ? "Medium" : "Low",
    severity: vegetationLoss > 60 ? "Critical" : vegetationLoss > 30 ? "High" : vegetationLoss > 15 ? "Moderate" : "Low"
  };
  
  return {
    isIllegal,
    confidence,
    locationName,
    riskLevel,
    environmentalImpact
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 === COORDINATE-BASED ANALYSIS API CALLED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const body: CoordinateAnalysisRequest = await request.json();
    const { latitude, longitude, startDate, endDate, analysisType, detectionThreshold, reportId } = body;

    console.log('📋 Request body:', JSON.stringify(body, null, 2));
    console.log('📍 Analyzing coordinates:', latitude, longitude);

    // Validate input
    if (!latitude || !longitude || !startDate || !endDate || !analysisType) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, startDate, endDate, analysisType' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges (Ghana bounds approximately)
    if (latitude < 4.0 || latitude > 12.0 || longitude < -4.0 || longitude > 2.0) {
      console.error('❌ Coordinates outside Ghana bounds');
      return NextResponse.json(
        { error: 'Coordinates appear to be outside Ghana. Please verify the coordinates.' },
        { status: 400 }
      );
    }

    console.log(`🎯 Starting coordinate analysis at: ${latitude}, ${longitude}`);
    console.log(`📊 Analysis type: ${analysisType}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    console.log(`🎚️ Detection threshold: ${detectionThreshold}`);

    // Step 1: Create AOI from coordinates
    console.log('🗺️ Step 1: Creating AOI from coordinates...');
    const aoiGeoJSON = createCoordinateAOI(latitude, longitude, 1); // 1km radius
    console.log('✅ AOI created successfully');
    console.log('📍 AOI center:', latitude, longitude);

    // Step 2: Run Sentinel-2 analysis with Google Earth Engine
    console.log('🛰️ Step 2: Running Sentinel-2 analysis...');
    
    const analysisResult = await runSentinelAnalysis({
      aoiGeoJSON,
      startDate,
      endDate,
      analysisType,
      detectionThreshold,
      districtName: `Coordinate_${latitude.toFixed(6)}_${longitude.toFixed(6)}`,
      locationSequence: 1,
      forceNewLocation: false
    });
    
    console.log('✅ Sentinel analysis completed');
    console.log('📊 Analysis result stats:', analysisResult.stats);

    // Step 3: Analyze legality based on coordinates and environmental impact
    console.log('⚖️ Step 3: Analyzing legality...');
    const legalityAnalysis = analyzeCoordinateLegality(
      latitude,
      longitude,
      analysisResult.stats.vegetationLossPercent || 0,
      analysisResult.stats.bareSoilIncreasePercent || 0
    );
    
    console.log('✅ Legality analysis completed');
    console.log('🚨 Illegal mining detected:', legalityAnalysis.isIllegal);
    console.log('📊 Confidence:', legalityAnalysis.confidence);

    // Step 4: Upload results to Supabase Storage
    console.log('☁️ Step 4: Uploading results to storage...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const coordinateId = `${latitude.toFixed(6)}_${longitude.toFixed(6)}`;
    
    const uploadPromises = [
      // Upload images
      uploadToSupabase(
        analysisResult.beforePNG,
        `analysis/coordinates/${coordinateId}/before_${timestamp}.png`,
        'image/png'
      ),
      uploadToSupabase(
        analysisResult.afterPNG,
        `analysis/coordinates/${coordinateId}/after_${timestamp}.png`,
        'image/png'
      ),
      uploadToSupabase(
        analysisResult.ndviDiffPNG,
        `analysis/coordinates/${coordinateId}/ndvi_${timestamp}.png`,
        'image/png'
      ),
      // Upload GeoJSON
      uploadToSupabase(
        Buffer.from(JSON.stringify((analysisResult as any).detectedPolygons || { type: 'FeatureCollection', features: [] })),
        `analysis/coordinates/${coordinateId}/detected_${timestamp}.geojson`,
        'application/geo+json'
      )
    ];

    const [beforeURL, afterURL, ndviURL, geojsonURL] = await Promise.all(uploadPromises);
    console.log('✅ All files uploaded successfully');

    // Step 5: Prepare final report
    const report: CoordinateAnalysisReport = {
      latitude,
      longitude,
      startDate,
      endDate,
      analysisType,
      vegetationLossPercent: analysisResult.stats.vegetationLossPercent,
      bareSoilIncreasePercent: analysisResult.stats.bareSoilIncreasePercent,
      waterTurbidity: analysisResult.stats.waterTurbidity,
      isIllegal: legalityAnalysis.isIllegal,
      illegalAreaKm2: legalityAnalysis.isIllegal ? 1 : 0, // Default 1 km² for coordinate-based analysis
      beforeImageURL: beforeURL,
      afterImageURL: afterURL,
      ndviImageURL: ndviURL,
      geojsonURL: geojsonURL,
      locationName: legalityAnalysis.locationName,
      confidence: legalityAnalysis.confidence,
      environmentalImpact: legalityAnalysis.environmentalImpact,
      createdAt: new Date().toISOString()
    };

    // Step 6: Save to database (optional)
    if (reportId) {
      console.log('💾 Step 6: Saving analysis report...');
      const analysisParams = {
        report_id: reportId,
        analysis_type: analysisType,
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        is_illegal: legalityAnalysis.isIllegal,
        confidence: legalityAnalysis.confidence,
        risk_level: legalityAnalysis.riskLevel,
        affected_area: 1.0, // Default for coordinate-based analysis
        location_name: legalityAnalysis.locationName,
        environmental_impact: legalityAnalysis.environmentalImpact,
        vegetation_loss_percent: analysisResult.stats.vegetationLossPercent,
        bare_soil_increase_percent: analysisResult.stats.bareSoilIncreasePercent,
        water_turbidity: analysisResult.stats.waterTurbidity,
        before_image_url: beforeURL,
        after_image_url: afterURL,
        ndvi_image_url: ndviURL,
        geojson_url: geojsonURL
      };
      
      try {
        const savedId = await saveReportAnalysis(analysisParams);
        console.log('✅ Analysis report saved to database with ID:', savedId);
        report.id = savedId;
      } catch (error) {
        console.warn('⚠️ Failed to save to database, but analysis completed:', error);
      }
    }

    console.log('🎉 === COORDINATE ANALYSIS COMPLETED SUCCESSFULLY ===');
    console.log('📊 Final result - Illegal:', report.isIllegal, 'Confidence:', report.confidence);
    
    return NextResponse.json(report);

  } catch (error) {
    console.error('💥 === COORDINATE ANALYSIS FAILED ===');
    console.error('❌ Error details:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Coordinate Analysis API',
    version: '1.0.0',
    endpoints: {
      POST: 'Run satellite analysis on specific coordinates'
    }
  });
}
