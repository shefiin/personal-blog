import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redis from "../config/redis.js";
import { createAccessToken, createRefreshToken } from "../utils/generateTokens.js";
import { setAuthCookies, clearAuthCookies } from "../utils/adminCookies.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { clearUserAuthCookies, clearUserRefreshCookie, setUserAuthCookies, setUserRefreshCookie } from "../utils/userCookies.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
  ACCOUNT_TEMPORARILY_LOCKED,
  EMAIL_ALREADY_VERIFIED,
  INVALID_CREDENTIALS,
  INVALID_OTP,
  INVALID_REFRESH_TOKEN,
  LOGIN_SUCCESS,
  LOGGED_OUT_SUCCESS,
  EMAIL_NOT_VERIFIED,
  OTP_EXPIRED_INVALID,
  OTP_RESENT_SUCCESSFULLY,
  OTP_VERIFIED_SUCCESSFULLY,
  OTP_WAIT_BEFORE_RESEND,
  REFRESH_TOKEN_MISSING,
  REGISTRATION_SUCCESS,
  SERVER_ERROR,
  TOKEN_REFRESHED,
  USER_ALREADY_EXISTS,
  USER_NOT_FOUND,
} from "../constants/messages.js";

const LOGIN_LIMIT = Number(process.env.ADMIN_LOGIN_ATTEMPT_LIMIT || 10);
const LOCK_TIME = Number(process.env.ADMIN_LOGIN_LOCK_TIME_SECONDS || 180);
const REFRESH_TTL = 7 * 24 * 60 * 60;
const REFRESH_GRACE_TTL = 120;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 30 * 1000;

const refreshKey = (id: string) => `admin:refresh:${id}`;
const refreshPrevKey = (id: string) => `admin:refresh:prev:${id}`;
const failKey = (id: string) => `admin:fail:${id}`;
const lockKey = (id: string) => `admin:locked:${id}`;
const otpKey = (email: string) => `user:otp:${email}`;
const otpCooldownKey = (email: string) => `user:otp:cooldown:${email}`;
const userRefreshKey = (id: string) => `user:refresh:${id}`;
const googleStateKey = (state: string) => `oauth:google:state:${state}`;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt
});

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const getGoogleRedirectUri = () => process.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/api/auth/google/callback";

const buildGoogleState = async (redirect: string) => {
  const state = crypto.randomBytes(24).toString("hex");
  await redis.set(googleStateKey(state), redirect, { EX: 10 * 60 });
  return state;
};

const resolveGoogleRedirect = async (state: string | undefined) => {
  if (!state) return `${getFrontendUrl()}/login?error=google_auth`;

  const redirectValue = await redis.get(googleStateKey(state));
  await redis.del(googleStateKey(state));

  if (!redirectValue) return `${getFrontendUrl()}/login?error=google_auth`;
  const redirect = String(redirectValue);
  if (!redirect.startsWith(getFrontendUrl())) return `${getFrontendUrl()}/login?error=google_auth`;

  return redirect;
};

const issueSessionForUser = async (user, res) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  if (user.role === "admin") {
    const adminId = user._id.toString();
    const key = refreshKey(adminId);
    await redis.sAdd(key, refreshToken);
    await redis.expire(key, REFRESH_TTL);
    await redis.del(refreshPrevKey(adminId));

    setAuthCookies(res, accessToken, refreshToken);
    return "admin";
  }

  const id = user._id.toString();
  await redis.sAdd(userRefreshKey(id), refreshToken);
  await redis.expire(userRefreshKey(id), REFRESH_TTL);
  setUserAuthCookies(res, accessToken, refreshToken);
  return "user";
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_CREDENTIALS });
    }

    if (user.role === "admin") {
      const locked = await redis.get(lockKey(user._id.toString()));
      if (locked) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ACCOUNT_TEMPORARILY_LOCKED });
      }
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      if (user.role === "admin") {
        const attempts = Number(await redis.incr(failKey(user._id.toString())));
        if (attempts === 1) {
          await redis.expire(failKey(user._id.toString()), LOCK_TIME);
        }
        if (attempts >= LOGIN_LIMIT) {
          await redis.set(lockKey(user._id.toString()), "1", { EX: LOCK_TIME });
        }
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_CREDENTIALS });
    }

    if (user.role === "admin") {
      await redis.del(failKey(user._id.toString()));
    }

    if (user.role !== "admin" && !user.isEmailVerified) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: EMAIL_NOT_VERIFIED });
    }

    const role = await issueSessionForUser(user, res);
    return res.status(HTTP_STATUS.OK).json({ message: LOGIN_SUCCESS, role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};

export const googleAuthStart = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${getFrontendUrl()}/login?error=google_config`);
    }

    const requestedRedirect = typeof req.query.redirect === "string" && req.query.redirect.startsWith(getFrontendUrl())
      ? req.query.redirect
      : `${getFrontendUrl()}/read`;

    const state = await buildGoogleState(requestedRedirect);
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: getGoogleRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    console.error("Google auth start error:", err);
    return res.redirect(`${getFrontendUrl()}/login?error=google_auth`);
  }
};

export const googleAuthCallback = async (req, res) => {
  const fallbackRedirect = `${getFrontendUrl()}/login?error=google_auth`;

  try {
    const redirectTarget = await resolveGoogleRedirect(typeof req.query.state === "string" ? req.query.state : undefined);
    const code = typeof req.query.code === "string" ? req.query.code : "";

    if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(fallbackRedirect);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getGoogleRedirectUri(),
        grant_type: "authorization_code"
      }).toString()
    });

    if (!tokenResponse.ok) {
      return res.redirect(fallbackRedirect);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return res.redirect(fallbackRedirect);
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      return res.redirect(fallbackRedirect);
    }

    const profile = await profileResponse.json() as {
      email?: string;
      name?: string;
      verified_email?: boolean;
    };

    const email = String(profile.email || "").toLowerCase().trim();
    if (!email || !profile.verified_email) {
      return res.redirect(fallbackRedirect);
    }

    const displayName = String(profile.name || email.split("@")[0] || "Reader").trim();
    const existingUser = await User.findOne({ email });

    const user = existingUser
      ? await User.findOneAndUpdate(
          { _id: existingUser._id },
          {
            name: existingUser.name || displayName,
            email,
            isEmailVerified: true
          },
          { new: true }
        )
      : await User.create({
          name: displayName,
          email,
          password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
          role: "user",
          isEmailVerified: true
        });

    await issueSessionForUser(user, res);
    return res.redirect(redirectTarget);
  } catch (err) {
    console.error("Google auth callback error:", err);
    return res.redirect(fallbackRedirect);
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.uf_admin_rt || req.cookies?.uf_user_rt;
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: REFRESH_TOKEN_MISSING });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
    }

    const adminId = payload.sub?.toString();
    if (!adminId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
    }

    if (req.cookies?.uf_admin_rt) {
      const key = refreshKey(adminId);
      const prevKey = refreshPrevKey(adminId);
      const [exists, prevToken] = await Promise.all([
        redis.sIsMember(key, token),
        redis.get(prevKey)
      ]);
      if (!exists && prevToken !== token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
      }

      const admin = await User.findById(adminId).select("_id email role name");
      if (!admin || admin.role !== "admin") {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
      }

      const newAccessToken = createAccessToken(admin);
      const newRefreshToken = createRefreshToken(admin);

      await redis.sRem(key, token);
      await redis.sAdd(key, newRefreshToken);
      await redis.expire(key, REFRESH_TTL);
      await redis.set(prevKey, token, { EX: REFRESH_GRACE_TTL });

      setAuthCookies(res, newAccessToken, newRefreshToken);
      return res.status(HTTP_STATUS.OK).json({ message: TOKEN_REFRESHED });
    }

    const key = userRefreshKey(adminId);
    const exists = await redis.sIsMember(key, token);
    if (!exists) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
    }

    const user = await User.findById(adminId).select("_id email role name isEmailVerified");
    if (!user || user.role !== "user" || !user.isEmailVerified) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: INVALID_REFRESH_TOKEN });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    await redis.sRem(key, token);
    await redis.sAdd(key, newRefreshToken);
    await redis.expire(key, REFRESH_TTL);
    setUserAuthCookies(res, newAccessToken, newRefreshToken);
    return res.status(HTTP_STATUS.OK).json({ message: TOKEN_REFRESHED });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};

export const logout = async (req, res) => {
  try {
    const adminToken = req.cookies?.uf_admin_rt;
    const userToken = req.cookies?.uf_user_rt;

    if (adminToken) {
      let payload: jwt.JwtPayload | null = null;
      try {
        payload = jwt.verify(adminToken, process.env.REFRESH_SECRET) as jwt.JwtPayload;
      } catch {
        payload = null;
      }

      const adminId = payload?.sub?.toString();
      if (adminId) {
        await Promise.all([
          redis.sRem(refreshKey(adminId), adminToken),
          redis.del(refreshPrevKey(adminId))
        ]);
      }
    }

    if (userToken) {
      let payload: jwt.JwtPayload | null = null;
      try {
        payload = jwt.verify(userToken, process.env.REFRESH_SECRET) as jwt.JwtPayload;
      } catch {
        payload = null;
      }

      const userId = payload?.sub?.toString();
      if (userId) {
        await redis.sRem(userRefreshKey(userId), userToken);
      }
    }

    clearAuthCookies(res);
    clearUserAuthCookies(res);
    return res.status(HTTP_STATUS.OK).json({ message: LOGGED_OUT_SUCCESS });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};

export const session = async (req, res) => {
  try {
    const adminToken = req.cookies?.uf_admin_rt;
    if (adminToken) {
      let payload: jwt.JwtPayload;
      try {
        payload = jwt.verify(adminToken, process.env.REFRESH_SECRET) as jwt.JwtPayload;
      } catch {
        payload = null as any;
      }

      const adminId = payload?.sub?.toString();
      if (adminId) {
        const [exists, prevToken] = await Promise.all([
          redis.sIsMember(refreshKey(adminId), adminToken),
          redis.get(refreshPrevKey(adminId))
        ]);
        if (exists || prevToken === adminToken) {
          return res.json({
            loggedIn: true,
            admin: {
              id: payload.sub,
              email: payload.email,
              role: payload.role
            }
          });
        }
      }
    }

    const userToken = req.cookies?.uf_user_rt;
    if (!userToken) {
      return res.json({ loggedIn: false });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(userToken, process.env.REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      return res.json({ loggedIn: false });
    }

    const userId = payload.sub?.toString();
    if (!userId) {
      return res.json({ loggedIn: false });
    }

    const exists = await redis.sIsMember(userRefreshKey(userId), userToken);
    if (!exists) {
      return res.json({ loggedIn: false });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "user") {
      return res.json({ loggedIn: false });
    }

    return res.json({
      loggedIn: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ loggedIn: false });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isEmailVerified) {
      return res.status(HTTP_STATUS.CONFLICT).json({ message: USER_ALREADY_EXISTS });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = existingUser
      ? await User.findOneAndUpdate(
          { _id: existingUser._id },
          {
            name,
            email: normalizedEmail,
            password: passwordHash,
            role: existingUser.role || "user",
            isEmailVerified: false
          },
          { new: true }
        )
      : await User.create({
          name,
          email: normalizedEmail,
          password: passwordHash,
          role: "user",
          isEmailVerified: false
        });

    await Promise.all([
      redis.set(otpKey(normalizedEmail), otp, { EX: OTP_TTL_MS / 1000 }),
      redis.set(otpCooldownKey(normalizedEmail), "1", { EX: OTP_RESEND_DELAY_MS / 1000 })
    ]);

    await sendOtpEmail(normalizedEmail, name, otp);

    return res.status(HTTP_STATUS.CREATED).json({
      message: REGISTRATION_SUCCESS,
      user: sanitizeUser(user),
      otpExpiresInSeconds: OTP_TTL_MS / 1000,
      resendAvailableInSeconds: OTP_RESEND_DELAY_MS / 1000
    });
  } catch (err) {
    console.error("User registration error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== "user") {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_NOT_FOUND });
    }

    if (user.isEmailVerified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: EMAIL_ALREADY_VERIFIED });
    }

    const storedOtp = await redis.get(otpKey(normalizedEmail));
    if (!storedOtp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: OTP_EXPIRED_INVALID });
    }

    if (storedOtp !== String(otp)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: INVALID_OTP });
    }

    user.isEmailVerified = true;
    await user.save();
    await Promise.all([
      redis.del(otpKey(normalizedEmail)),
      redis.del(otpCooldownKey(normalizedEmail))
    ]);

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await redis.sAdd(userRefreshKey(String(user._id)), refreshToken);
    await redis.expire(userRefreshKey(String(user._id)), REFRESH_TTL);
    setUserAuthCookies(res, accessToken, refreshToken);

    return res.status(HTTP_STATUS.OK).json({ message: OTP_VERIFIED_SUCCESSFULLY });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== "user") {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: USER_NOT_FOUND });
    }

    if (user.isEmailVerified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: EMAIL_ALREADY_VERIFIED });
    }

    const remainingSeconds = Number(await redis.ttl(otpCooldownKey(normalizedEmail)));
    if (remainingSeconds > 0) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        message: OTP_WAIT_BEFORE_RESEND,
        resendAvailableInSeconds: remainingSeconds
      });
    }

    const otp = generateOtp();
    await Promise.all([
      redis.set(otpKey(normalizedEmail), otp, { EX: OTP_TTL_MS / 1000 }),
      redis.set(otpCooldownKey(normalizedEmail), "1", { EX: OTP_RESEND_DELAY_MS / 1000 })
    ]);

    await sendOtpEmail(user.email, user.name, otp);

    return res.status(HTTP_STATUS.OK).json({
      message: OTP_RESENT_SUCCESSFULLY,
      resendAvailableInSeconds: OTP_RESEND_DELAY_MS / 1000
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: SERVER_ERROR });
  }
};
