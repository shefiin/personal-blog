import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
});

transporter.verify((err) => {
    if (err) {
      console.error("❌ SMTP config error:", err);
    } else {
      console.log("✅ SMTP transporter ready");
    }
  });
  
export default transporter;
