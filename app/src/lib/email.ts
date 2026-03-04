import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY ?? ""
const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Superteam Academy <noreply@superteambrazil.com>"

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!resendApiKey) {
    console.warn("Email not sent: RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const resend = new Resend(resendApiKey)
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    })

    if (response.error) {
      throw new Error(response.error.message || "Unknown Resend error")
    }

    return { success: true, data: { provider: "resend", id: response.data?.id } }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

export async function sendAssignmentGradedEmail({
  to,
  studentName,
  assignmentName,
  courseName,
  score,
  maxScore,
  feedback,
}: {
  to: string
  studentName: string
  assignmentName: string
  courseName: string
  score: number
  maxScore: number
  feedback?: string
}) {
  const percentage = Math.round((score / maxScore) * 100)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz Graded</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background-color: #9945FF; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Quiz Graded</h1>
      </div>

      <!-- Content -->
      <div style="padding: 30px 20px;">
        <p style="margin: 0 0 20px; color: #333;">Hi ${studentName},</p>

        <p style="margin: 0 0 20px; color: #333;">
          Your quiz has been graded! Here are the details:
        </p>

        <!-- Quiz Details Card -->
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Course:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Quiz:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${assignmentName}</td>
            </tr>
          </table>
        </div>

        <!-- Score Display -->
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 48px; font-weight: bold; color: ${percentage >= 70 ? '#9945FF' : percentage >= 50 ? '#f59e0b' : '#ef4444'};">
            ${score}/${maxScore}
          </div>
          <div style="color: #666; font-size: 18px; margin-top: 5px;">
            ${percentage}%
          </div>
        </div>

        ${feedback ? `
        <!-- Feedback Section -->
        <div style="margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 10px;">Instructor Feedback:</h3>
          <div style="background-color: #f0f9ff; border-left: 4px solid #9945FF; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; color: #333; white-space: pre-wrap;">${feedback}</p>
          </div>
        </div>
        ` : ''}

        <p style="margin: 30px 0 0; color: #333;">
          Keep up the great work!
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          This email was sent by Superteam Brazil Academy
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`

  const text = `
Hi ${studentName},

Your quiz has been graded!

Course: ${courseName}
Quiz: ${assignmentName}
Score: ${score}/${maxScore} (${percentage}%)
${feedback ? `\nInstructor Feedback:\n${feedback}` : ''}

Keep up the great work!

- Superteam Brazil Academy
`

  return sendEmail({
    to,
    subject: `Your quiz "${assignmentName}" has been graded`,
    html,
    text,
  })
}
