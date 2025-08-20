import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisReports } from '../../admin/components/satellite/lib/supabaseClient';

export interface ReportsQuery {
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  analysisType?: 'NDVI' | 'BSI' | 'WATER' | 'CHANGE';
  isIllegal?: boolean;
  limit?: number;
  offset?: number;
}

// GET handler to fetch satellite analysis reports
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const filters: ReportsQuery = {
      district: searchParams.get('district') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      analysisType: (searchParams.get('analysisType') as any) || undefined,
      isIllegal: searchParams.get('isIllegal') ? searchParams.get('isIllegal') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };
    
    // Fetch reports from database
    const reports = await getAnalysisReports(filters);
    
    // Calculate summary statistics
    const summary = {
      total: reports.length,
      illegal: reports.filter(r => r.is_illegal).length,
      byAnalysisType: reports.reduce((acc, report) => {
        acc[report.analysis_type] = (acc[report.analysis_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byDistrict: reports.reduce((acc, report) => {
        acc[report.district] = (acc[report.district] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return NextResponse.json({
      reports,
      summary,
      filters
    });
    
  } catch (error) {
    console.error('Error fetching satellite reports:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch reports', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
} 