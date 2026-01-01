import { sendOTP } from "./providers/index.js";

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function issueOTP({ redis, email, phone, purpose }) {
    const otp = generateOTP()
    const key = `otp:${purpose}:${email}`;
  
    await redis.set(key, otp, "EX", 300);
    await sendOTP({ email, otp });
}
  
export async function verifyOTP({ redis, email, otp, purpose }) {
    const key = `otp:${purpose}:${email}`;
    const storedOtp = await redis.get(key);
  
    if (!storedOtp || storedOtp !== otp) {
      return false;
    }
  
    await redis.del(key);
    return true;
}