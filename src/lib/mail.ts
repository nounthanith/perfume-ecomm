import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateOtp(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  otp: string
) {
  const fromName = process.env.EMAIL_FROM_NAME || "Your Shop Name";
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Your Email Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Verify your email</h2>
        <p style="margin: 0 0 8px; color: #374151; line-height: 1.6;">Hi ${name},</p>
        <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Use the code below to verify your email address. This code expires in ${
          process.env.EMAIL_OTP_EXPIRES_MINUTES || 10
        } minutes.</p>
        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>
        <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
}