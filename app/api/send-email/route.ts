import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@dashboard.underla.lat'

function formatEmailContent(content: string): string {
  return content
    .replace(/\n/g, '<br>')
    .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length))
}

export async function POST(request: Request) {
  try {
    const { email, subject, content } = await request.json()

    if (!email || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const formattedContent = formatEmailContent(content)

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: subject,
      html: formattedContent,
    })

    if (error) {
      throw new Error(`Resend API error: ${error.message}`)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
