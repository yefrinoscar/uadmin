import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';
import { z } from 'zod';
import { corsHeaders } from '@/lib/cors'

// Define the Zod schema for input validation
const requestSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  email: z.string().email({ message: 'Invalid email format' }).optional(),
  phone_number: z.string().optional(),
  name: z.string().optional(),
}).refine(data => data.email || data.phone_number, {
  message: 'Either email or phone number is required',
  path: ['email', 'phone_number'], // Optional: specify the path for the error
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("body", body); 

    // Validate input using Zod
    const validationResult = requestSchema.safeParse(body);

    console.log("validationResult", validationResult); 

    if (!validationResult.success) {
      // Combine error messages for a clearer response
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Validation failed: ${errorMessages}` }, { status: 400, headers: corsHeaders });
    }

    // Use validated data
    const { description, email, phone_number, name } = validationResult.data;

    const supabase = createAuthenticatedClient();

    let clientId: string | null = null;

    console.log("email", email);
    console.log("phone_number", phone_number);
    

    // Find or create client
    if (email || phone_number) {
      let query = supabase.from('clients').select('id');
      // Prioritize email if both are provided for searching
      if (email) {
        query = query.eq('email', email);
      } else if (phone_number) {
        query = query.eq('phone_number', phone_number);
      }

      const { data: existingClient, error: findError } = await query.maybeSingle();

      if (findError && findError.code !== 'PGRST116') { // PGRST116: 'Searched for one row, but found 0'
        console.error('Error finding client:', findError);
        throw new Error('Failed to check for existing client');
      }

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client if not found
        const clientData: { email?: string; phone_number?: string; name?: string } = {};
        if (email) clientData.email = email;
        if (phone_number) clientData.phone_number = phone_number;
        if (name) clientData.name = name; // Include name if provided

        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert(clientData)
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating client:', createError);
          throw new Error('Failed to create new client');
        }
        clientId = newClient.id;
      }
    }

    if (!clientId) {
      console.error('Error creating client:');

       throw new Error('Failed to obtain client ID');
    }

    // Fetch all user IDs
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id');

    if (userError) {
      console.error('Error fetching users:', userError);
      throw new Error('Failed to fetch users for assignment');
    }

    if (!users || users.length === 0) {
      throw new Error('No users found to assign the request to');
    }

    // Select a random user ID
    const randomUserIndex = Math.floor(Math.random() * users.length);
    const assignedUserId = users[randomUserIndex].id;

    // Insert purchase request
    const { data: newRequest, error: insertError } = await supabase
      .from('purchase_requests')
      .insert({
        description,
        client_id: clientId,
        status: 'pending', // Default status
        assigned_user_id: assignedUserId // Assign to a random user
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting purchase request:', insertError);
      throw new Error('Failed to create purchase request');
    }

    return NextResponse.json(newRequest, { status: 201 , headers: corsHeaders });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 , headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
} 