import { createAuthenticatedClient } from '@/lib/supabase-client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAuthenticatedClient()
    
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
    
    if (error) {
      console.error('Error fetching promotions:', error)
      return NextResponse.json(
        { error: 'Error fetching promotions' },
        { status: 500 }
      )
    }

    console.log(error);
    console.log(promotions);
    

    return NextResponse.json(promotions)

  } catch (error) {
    console.error('Error in promotions route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 