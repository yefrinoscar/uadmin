import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';
import { corsHeaders } from '@/lib/cors';

/**
 * API endpoint to get the current exchange rate from database
 * Returns the most recent exchange rate stored in the database
 */
export async function GET() {
  try {
    // Create authenticated Supabase client
    const supabase = createAuthenticatedClient();

    // Get the most recent exchange rate
    const { data: exchangeRate, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no data exists, return a default rate with a warning
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          warning: 'No exchange rate data available',
          data: null,
          message: 'Please run the cron job to fetch the latest exchange rate'
        }, { status: 404, headers: corsHeaders });
      }
      
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: exchangeRate
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error fetching current exchange rate:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch current exchange rate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
