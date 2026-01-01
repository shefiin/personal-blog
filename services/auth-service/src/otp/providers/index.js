import { sendEmailOTP } from "./email.provider.js";
import { sendSmsOTP } from "./sms.twilio.js";


export async function sendOTP({ email, phone, otp }){
    const channel = process.env.OTP_CHANNEL 

    if (channel === "sms") {
        return sendSmsOTP({ to: phone, otp });
    }
    
    return sendEmailOTP({ to: email, otp });
}


