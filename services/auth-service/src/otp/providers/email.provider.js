import transporter from "../../config/mailer.js";

export async function sendEmailOTP({ to, otp }){
    await transporter.sendMail({
        to,
        subject: "Your UrbanFresh OTP",
        html: `
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your UrbanFresh Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #333;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #00C851 0%, #28a745 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; font-size: 2.5em; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0, 200, 81, 0.2);">UrbanFresh</h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 1.1em;">Quick Commerce, Fresh Delivered</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; font-size: 1.5em; color: #333; text-align: center;">Verify Your Phone Number</h2>
                            
                            <p style="margin: 0 0 30px; line-height: 1.6; color: #6c757d; text-align: center; font-size: 1.1em;">
                                Hi there,<br>
                                We're excited to get you started with UrbanFresh! To complete your verification, enter the code below into the app or website.
                            </p>
                            
                            <!-- OTP Code Display -->
                            <div style="text-align: center; margin: 30px 0;">
                                <div style="display: inline-block; padding: 20px 30px; background-color: #f8f9fa; border-radius: 12px; border: 2px solid #00C851; box-shadow: 0 4px 12px rgba(0, 200, 81, 0.15);">
                                    <h3 style="margin: 0; font-size: 3em; font-weight: bold; color: #00C851; letter-spacing: 8px;"><b>${otp}</b></h3>
                                    <p style="margin: 5px 0 0; font-size: 0.9em; color: #6c757d;">Your 6-digit verification code</p>
                                </div>
                            </div>
                            
                            <p style="margin: 0 0 30px; line-height: 1.6; color: #6c757d; text-align: center; font-size: 1em;">
                                This OTP is valid for <strong>5 minutes</strong> for your security. If you didn't request this, please ignore this email.
                            </p>
                            
                            <!-- Call to Action Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="#" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #00C851 0%, #28a745 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 1.1em; font-weight: bold; transition: transform 0.2s ease;">
                                    Open UrbanFresh App
                                </a>
                            </div>
                            
                            <p style="margin: 0 0 20px; line-height: 1.6; color: #6c757d; text-align: center; font-size: 0.95em;">
                                Need another code? <a href="#" style="color: #00C851; text-decoration: none; font-weight: 500;">Resend Verification</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6c757d; font-size: 0.9em;">
                                UrbanFresh | Fresh Groceries Delivered in Minutes
                            </p>
                            <p style="margin: 0; color: #6c757d; font-size: 0.85em;">
                                <a href="#" style="color: #6c757d; text-decoration: none;">Privacy Policy</a> | 
                                <a href="#" style="color: #6c757d; text-decoration: none;">Terms of Service</a> | 
                                <a href="#" style="color: #6c757d; text-decoration: none;">Contact Us</a>
                            </p>
                            <p style="margin: 20px 0 0; color: #adb5bd; font-size: 0.8em;">
                                © 2025 UrbanFresh. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    });
}