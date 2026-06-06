import nodemailer from "nodemailer";

let lastAlertSentAt = 0;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15-minute lock

export const checkAndSendAlert = async (reason: string, details: string) => {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) return;

  // Initialized safely inside the call block
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ALERT_EMAIL_FROM,
      pass: process.env.ALERT_EMAIL_PASS,
    },
  });

  lastAlertSentAt = now;

  const mailOptions = {
    from: `"PulseOps Alert System" <${process.env.ALERT_EMAIL_FROM}>`,
    to: process.env.ALERT_EMAIL_TO,
    subject: `🚨 CRITICAL INCIDENT ALERT: Job Portal System`,
    text: `Attention DevOps Engineer,\n\nA critical condition was detected on your application server.\n\nIncident Profile: ${reason}\n\nDiagnostic Trail:\n${details}\n\n---\nPulseOps Automated Infrastructure Shield.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Alert Email dispatched successfully to ${process.env.ALERT_EMAIL_TO}`);
  } catch (err: any) {
    console.error("❌ Alert Mailer Failure:", err.message);
  }
};