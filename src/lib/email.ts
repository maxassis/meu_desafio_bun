import nodemailer from 'nodemailer'

import { env } from '../shared/config/env'

interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
})

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const info = await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text,
    html,
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)

  if (previewUrl) {
    console.log(`Email preview: ${previewUrl}`)
  }

  return info
}
