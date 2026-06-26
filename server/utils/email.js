import nodemailer from "nodemailer";

/**
 * Email transport — uses Ethereal (test SMTP) in development.
 * In production, swap to a real provider (Resend, SES, SMTP).
 *
 * All sent emails are logged to console AND available at:
 * https://ethereal.email/messages (login with the Ethereal creds)
 */

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Use real SMTP if configured
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Create an Ethereal test account (free, emails viewable online)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      `📧 Email test account: ${testAccount.user} / ${testAccount.pass}`
    );
    console.log(`📧 View sent emails: https://ethereal.email/messages`);
  }

  return transporter;
}

/**
 * Send an email. Returns the preview URL (Ethereal) or messageId.
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transport = await getTransporter();
    const fromName = process.env.EMAIL_FROM || "CodeHire <noreply@codehire.dev>";
    const info = await transport.sendMail({
      from: fromName,
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Preview: ${previewUrl}`);
    }
    console.log(`📧 Email sent to ${to}: ${subject} (${info.messageId})`);
    return { messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`📧 Email failed: ${err.message}`);
    return null;
  }
}

/**
 * Pre-built email templates
 */
export function interviewScheduledEmail({ candidateName, candidateEmail, date, notes, company }) {
  const formattedDate = new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    to: candidateEmail,
    subject: `Interview Scheduled – ${company || "CodeHire"}`,
    text: `Hi ${candidateName},\n\nYour interview has been scheduled for ${formattedDate}.\n\n${notes ? `Notes: ${notes}\n\n` : ""}Best,\n${company || "CodeHire"} Team`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0F172A; margin-bottom: 8px;">Interview Scheduled</h2>
        <p style="color: #555;">Hi ${candidateName},</p>
        <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600; color: #4F46E5;">📅 ${formattedDate}</p>
          ${notes ? `<p style="margin: 12px 0 0; color: #555; font-size: 14px;">${notes}</p>` : ""}
        </div>
        <p style="color: #555;">We look forward to speaking with you!</p>
        <p style="color: #999; font-size: 13px; margin-top: 32px;">— ${company || "CodeHire"} Team</p>
      </div>
    `,
  };
}

export function stageChangeEmail({ candidateName, candidateEmail, newStage, company }) {
  const stageLabels = {
    screen: "Screening",
    assess: "Assessment",
    interview: "Interview",
    offer: "Offer",
    hired: "Hired! 🎉",
    rejected: "Application Closed",
  };

  return {
    to: candidateEmail,
    subject: `Application Update – ${company || "CodeHire"}`,
    text: `Hi ${candidateName},\n\nYour application status has been updated to: ${stageLabels[newStage] || newStage}.\n\nBest,\n${company || "CodeHire"} Team`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0F172A; margin-bottom: 8px;">Application Update</h2>
        <p style="color: #555;">Hi ${candidateName},</p>
        <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #4F46E5;">${stageLabels[newStage] || newStage}</p>
        </div>
        <p style="color: #555;">Thank you for your continued interest.</p>
        <p style="color: #999; font-size: 13px; margin-top: 32px;">— ${company || "CodeHire"} Team</p>
      </div>
    `,
  };
}
