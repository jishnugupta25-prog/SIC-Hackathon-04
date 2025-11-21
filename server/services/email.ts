import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const mailOptions = {
    from: `"SafeGuard Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your SafeGuard Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e91e63 0%, #f06292 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">SafeGuard</h1>
          <p style="color: white; margin: 10px 0 0 0;">Crime Reporter & Safety Assistant</p>
        </div>
        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for registering with SafeGuard. To complete your registration, please use the verification code below:
          </p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e91e63;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 SafeGuard. Stay safe, stay protected.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
