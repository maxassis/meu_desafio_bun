import { Resend } from 'resend'

import { ENV } from 'varlock/env'

interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

const resend = new Resend(ENV.RESEND_API_KEY)

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const data = await resend.emails.send({
    from: ENV.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  })

  return data
}
