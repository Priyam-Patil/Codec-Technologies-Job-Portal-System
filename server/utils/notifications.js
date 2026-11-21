// Optional transport: unconfigured installations perform no external call.
export async function notifyApplication(user, job, status, interview) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return 'not_configured';
  if (!user?.email) return 'no_recipient';
  const message = interview
    ? `Interview for ${job.title}: ${new Date(interview.scheduledAt).toISOString()} (UTC). ${interview.meetingDetails}. Status: ${interview.status}`
    : status === 'Pending' ? `Your application for ${job.title} was submitted.` : `Your application for ${job.title} is now ${status.toLowerCase()}.`;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [user.email], subject: `InsiderJobs: ${job.title}`, text: message }),
    });
    return response.ok ? 'sent' : 'failed';
  } catch { return 'failed'; }
}
