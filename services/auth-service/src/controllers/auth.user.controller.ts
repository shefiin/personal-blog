import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { getUserCookieOptions, clearUserCookies } from "../utils/userCookies.js";
import redis from "../config/redis.js";
import jwt from "jsonwebtoken";
import { issueOTP, verifyOTP } from "../otp/otp.service.js";

const isProd = process.env.NODE_ENV === "production";
const { accessOption, refreshOption } = getUserCookieOptions(isProd);

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
    const userId = decoded.sub;
    const storedToken = await redis.get(`refresh:${userId}`);

    if (!storedToken || storedToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(userId).select("_id email role name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await redis.set(`refresh:${user._id}`, newRefreshToken, { EX: 7 * 24 * 60 * 60 });

    res.cookie("access_token", newAccessToken, accessOption);
    res.cookie("refresh_token", newRefreshToken, refreshOption);

    res.json({ message: "Token refreshed" });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await redis.set(
      `register:${email}`,
      JSON.stringify({
        name,
        email,
        password: hashed,
        role: "user"
      }),
      "EX",
      10 * 60
    );

    await issueOTP({
      redis,
      email,
      purpose: "register"
    });

    const cooldownkey = `otp:cooldown:${email}`;
    await redis.set(cooldownkey, "1", {
      EX: 30
    });

    const verifyToken = jwt.sign({ email }, process.env.JWT_KEY, { expiresIn: "10m" });

    res.status(201).json({
      message: "OTP send to your email",
      verifyToken
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyRegisterOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Verification token missing" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const email = payload.email;

    const valid = await verifyOTP({
      redis,
      email,
      otp,
      purpose: "register"
    });

    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const raw = await redis.get(`register:${email}`);
    if (!raw) {
      return res.status(400).json({ message: "Registration expired" });
    }

    const data = JSON.parse(raw);

    const user = await User.create({
      ...data
    });

    await redis.del(`register:${email}`);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redis.set(`refresh:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    res.cookie("access_token", accessToken, accessOption);
    res.cookie("refresh_token", refreshToken, refreshOption);

    res.json({
      message: "Registration completed",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing verification token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;
    const email = decoded.email;

    const pending = await redis.get(`register:${email}`);
    if (!pending) {
      return res.status(400).json({
        message: "Registration expired. Please register again."
      });
    }

    const cooldownkey = `otp:cooldown:${email}`;

    if (await redis.exists(cooldownkey)) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP"
      });
    }

    const attemptsKey = `otp:attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, 600);
    }

    if (attempts > 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Try again later."
      });
    }

    await issueOTP({
      redis,
      email,
      purpose: "register"
    });

    await redis.set(cooldownkey, "1", {
      EX: 30
    });

    res.json({ message: "OTP resent successfully" });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Verification expired. Please register again."
      });
    }
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await redis.set(`refresh:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    res.cookie("access_token", accessToken, accessOption);
    res.cookie("refresh_token", refreshToken, refreshOption);

    res.json({
      message: "Login success",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (token) {
      const decoded = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
      await redis.del(`refresh:${decoded.sub}`);
    }

    clearUserCookies(res);

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    await issueOTP({
      redis,
      email,
      purpose: "reset-password"
    });

    const cooldownkey = `otp:cooldown:${email}`;
    await redis.set(cooldownkey, "1", {
      EX: 30
    });

    const verifyToken = jwt.sign({ email, purpose: "reset-password" }, process.env.JWT_KEY, {
      expiresIn: "10m"
    });

    res.json({
      message: "OTP sent to your email",
      verifyToken
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to send reset OTP"
    });
  }
};

export const verifyResetOTP = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Verification token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;
    const email = decoded.email;
    const purpose = decoded.purpose;

    if (purpose !== "reset-password") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    const { otp } = req.body;

    const valid = await verifyOTP({
      redis,
      email,
      otp,
      purpose: "reset-password"
    });

    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await redis.set(`reset:verified:${email}`, "1", {
      EX: 10 * 60
    });

    res.json({
      message: "OTP verified. You can reset password now."
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(404).json({
        message: "Verification token missing"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;
    const email = decoded.email;
    const purpose = decoded.purpose;

    if (!purpose || purpose !== "reset-password") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    const verified = await redis.get(`reset:verified:${email}`);
    if (!verified) {
      return res.status(400).json({
        message: "OTP verification required"
      });
    }

    const { newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { password: hashed });
    await redis.del(`reset:verified:${email}`);

    res.json({ message: "Password reset succssful" });
  } catch (err) {
    res.status(500).json({
      message: "Some error while resetting password"
    });
  }
};
