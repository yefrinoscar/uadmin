// import { NextResponse } from "next/server"
// import { createClient } from "@supabase/supabase-js"
// import Mailgun from "mailgun.js"
// import formData from "form-data"

// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
// const mailgun = new Mailgun(formData)
// const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY! })

// export async function POST(request: Request) {
//   const requestData = await request.json()

//   // Save to Supabase
//   const { data, error } = await supabase.from("purchase_requests").insert([requestData])

//   if (error) {
//     return NextResponse.json({ error: "Failed to save request" }, { status: 500 })
//   }

//   // Send email
//   const emailResult = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
//     from: "Underapp <mailgun@your-domain.com>",
//     to: [requestData.email],
//     subject: "Your Purchase Request",
//     text: `Your purchase request for ${requestData.description} has been received.`,
//   })

//   if (!emailResult.status) {
//     return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
//   }

//   return NextResponse.json({ message: "Request registered and email sent" }, { status: 200 })
// }

