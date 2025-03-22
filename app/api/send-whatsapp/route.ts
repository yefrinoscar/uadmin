import { NextResponse } from 'next/server'

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

export async function POST(request: Request) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message || !WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: 'Missing required fields or configuration' },
        { status: 400 }
      )
    }

    // Format phone number (remove any non-numeric characters)
    const formattedPhone = phoneNumber.replace(/\D/g, '')

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            body: message
          }
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }

    const data = await response.json()
    return NextResponse.json({ 
      success: true,
      messageId: data.messages?.[0]?.id
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}
