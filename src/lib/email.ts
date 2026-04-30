import { Resend } from 'resend'

import { env } from '../shared/config/env'

interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

const resend = new Resend(env.resendApiKey)

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const data = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    text,
    html,
  })

  return data
}
