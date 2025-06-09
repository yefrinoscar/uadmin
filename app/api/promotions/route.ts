import { createAuthenticatedClient } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAuthenticatedClient();

    const now = new Date().toISOString();
    
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('enabled', true)
      .lte('start_date', now)
      .or(`end_date.gte.${now},end_date.is.null`)

    if (error) {
      console.error('Error fetching promotions:', error)
      return NextResponse.json(
        { error: 'Error fetching promotions' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(promotions, { headers: corsHeaders })

  } catch (error) {
    console.error('Error in promotions route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
} 