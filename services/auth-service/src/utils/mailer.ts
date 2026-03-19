import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
});

const getFromAddress = () => process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@codecontext.local";

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Verify your Code & Context account",
    text: `Hi ${name || "there"}, your verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <p>Hi ${name || "there"},</p>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
};
