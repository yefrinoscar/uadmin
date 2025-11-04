import { createAuthenticatedClient } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAuthenticatedClient();

    const { data: collections, error } = await supabase
      .from('collections')
      .select('handle, banner_url, video_url')
      .eq('published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json(
        { error: 'Error fetching collections' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(collections, { headers: corsHeaders })

  } catch (error) {
    console.error('Error in collections route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
