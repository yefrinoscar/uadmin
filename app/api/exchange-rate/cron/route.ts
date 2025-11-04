import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';
import { corsHeaders } from '@/lib/cors';

interface DecolectaExchangeRateResponse {
  buy_price: string;
  sell_price: string;
  base_currency: string;
  quote_currency: string;
  date: string;
}

/**
 * Cron job endpoint to fetch and store exchange rate from Decolecta API
 * This should be called daily at 9 AM
 * 
 * To set up the cron job:
 * 1. Use Vercel Cron Jobs (vercel.json)
 * 2. Or use an external service like cron-job.org
 * 3. Or use GitHub Actions
 * 
 * Authorization: Use CRON_SECRET environment variable for security
 */
export async function GET(request: Request) {
  try {
    // Verify authorization (cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Create authenticated Supabase client
    const supabase = createAuthenticatedClient();

    // Get today's date in Lima timezone (Peru)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD format

    // Check if we already have today's exchange rate
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('date', today)
      .single();

    if (existingRate) {
      return NextResponse.json({
        message: 'Exchange rate already exists for today',
        data: existingRate,
        skipped: true
      }, { headers: corsHeaders });
    }

    // Fetch exchange rate from Decolecta API
    const decolectaApiKey = process.env.DECOLECTA_API_KEY;
    
    if (!decolectaApiKey) {
      throw new Error('DECOLECTA_API_KEY is not configured');
    }

    const response = await fetch(
      `https://api.decolecta.com/v1/tipo-cambio/sunat?date=${today}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decolectaApiKey}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Decolecta API error: ${response.status} - ${errorText}`);
    }

    const exchangeRateData: DecolectaExchangeRateResponse = await response.json();

    // Validate the response
    if (!exchangeRateData.buy_price || !exchangeRateData.sell_price) {
      throw new Error('Invalid exchange rate data received from Decolecta API');
    }

    // Store in database
    const { data: newRate, error: insertError } = await supabase
      .from('exchange_rates')
      .insert({
        buy_price: parseFloat(exchangeRateData.buy_price),
        sell_price: parseFloat(exchangeRateData.sell_price),
        base_currency: exchangeRateData.base_currency,
        quote_currency: exchangeRateData.quote_currency,
        date: exchangeRateData.date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    return NextResponse.json({
      message: 'Exchange rate fetched and stored successfully',
      data: newRate,
      source: 'decolecta'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in exchange rate cron job:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch and store exchange rate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
