import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'Chessboard <notifications@chessboard.sa>'

export async function sendApplicationReceived(seekerEmail: string, jobTitle: string, companyName: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to: seekerEmail,
    subject: `Application received: ${jobTitle} at ${companyName}`,
    html: `
      <h2>Thanks for applying!</h2>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
      <p>We'll notify you when there's an update on your application status.</p>
      <p>— The Chessboard Team</p>
    `,
  })
}

export async function sendStatusUpdate(seekerEmail: string, jobTitle: string, companyName: string, status: string) {
  if (!process.env.RESEND_API_KEY) return

  const statusMessages: Record<string, { subject: string; body: string }> = {
    under_review: {
      subject: `Your application is being reviewed`,
      body: `<p>Good news! <strong>${companyName}</strong> is reviewing your application for <strong>${jobTitle}</strong>.</p>`,
    },
    shortlisted: {
      subject: `You've been shortlisted!`,
      body: `<p>Congratulations! You've been shortlisted for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p><p>The company may reach out to schedule an interview soon.</p>`,
    },
    interview: {
      subject: `Interview scheduled`,
      body: `<p>An interview has been scheduled for your application to <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p><p>Check your dashboard for details.</p>`,
    },
    offered: {
      subject: `You've received an offer!`,
      body: `<p>Exciting news! <strong>${companyName}</strong> has extended an offer for the <strong>${jobTitle}</strong> position.</p><p>Log in to your dashboard to review the offer details.</p>`,
    },
    rejected: {
      subject: `Update on your application`,
      body: `<p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p><p>After careful consideration, the team has decided to move forward with other candidates. We encourage you to continue applying to other opportunities on Chessboard.</p>`,
    },
  }

  const msg = statusMessages[status]
  if (!msg) return

  await resend.emails.send({
    from: FROM,
    to: seekerEmail,
    subject: msg.subject,
    html: `<h2>${msg.subject}</h2>${msg.body}<p>— The Chessboard Team</p>`,
  })
}

export async function sendNewApplicationNotification(companyEmail: string, seekerName: string, jobTitle: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to: companyEmail,
    subject: `New application: ${seekerName} for ${jobTitle}`,
    html: `
      <h2>New Application Received</h2>
      <p><strong>${seekerName}</strong> has applied for <strong>${jobTitle}</strong>.</p>
      <p>Log in to your company dashboard to review their profile.</p>
      <p>— The Chessboard Team</p>
    `,
  })
}

export async function sendTeamInvitation(email: string, companyName: string, inviterName: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're invited to join ${companyName} on Chessboard`,
    html: `
      <h2>Team Invitation</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Chessboard.</p>
      <p>Click the link below to accept the invitation and set up your account.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/signup/company">Accept Invitation</a></p>
      <p>— The Chessboard Team</p>
    `,
  })
}
