import { createAuthenticatedClient } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const supabase = createAuthenticatedClient();
    const { handle } = await params;

    const { data: collection, error } = await supabase
      .from('collections')
      .select('handle, banner_url, video_url')
      .eq('handle', handle)
      .eq('published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404, headers: corsHeaders }
        )
      }
      
      console.error('Error fetching collection:', error)
      return NextResponse.json(
        { error: 'Error fetching collection' },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(collection, { headers: corsHeaders })

  } catch (error) {
    console.error('Error in collection route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
