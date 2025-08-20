import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Test API endpoint to verify Supabase connection and table structure
 */
export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('mining_reports')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('Connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message
      });
    }
    
    // Test 2: Check table structure
    const { data: tableData, error: tableError } = await supabase
      .from('mining_reports')
      .select('*')
      .limit(1);
    
    console.log('Table structure test:', { tableData, tableError });
    
    // Test 3: Try a simple insert
    const testReport = {
      id: crypto.randomUUID(),
      report_id: 'TEST-' + Date.now(),
      report_type: 'community_member',
      threat_level: 3,
      incident_description: 'Test report for debugging',
      mining_activity_type: 'surface_mining',
      location_lat: 5.6037,
      location_lng: -0.1870,
      location_description: 'Test location',
      evidence_files: [],
      blur_faces: true,
      strip_location: true,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('mining_reports')
      .insert(testReport)
      .select('report_id');
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code
      });
    }
    
    console.log('Insert test successful:', insertData);
    
    // Clean up test record
    await supabase
      .from('mining_reports')
      .delete()
      .eq('report_id', testReport.report_id);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and operations working correctly',
      testResults: {
        connection: 'OK',
        tableAccess: 'OK',
        insert: 'OK',
        cleanup: 'OK'
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
