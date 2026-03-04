import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import { createAccessToken, createRefreshToken } from "../utils/generateTokens.js";
import { setAuthCookies, clearAuthCookies } from "../utils/adminCookies.js";

const LOGIN_LIMIT = 5;
const LOCK_TIME = 10 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;
const REFRESH_GRACE_TTL = 120;

const refreshKey = (id: string) => `admin:refresh:${id}`;
const refreshPrevKey = (id: string) => `admin:refresh:prev:${id}`;
const failKey  = (id: string) => `admin:fail:${id}`;
const lockKey  = (id: string) => `admin:locked:${id}`;

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email });
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const locked = await redis.get(lockKey(admin._id.toString()));
    if (locked) {
      return res.status(403).json({ message: "Account temporarily locked" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      const attempts = Number(await redis.incr(failKey(admin._id.toString())));
      if (attempts === 1) {
        await redis.expire(failKey(admin._id.toString()), LOCK_TIME);
      }
      if (attempts >= LOGIN_LIMIT) {
        await redis.set(lockKey(admin._id.toString()), "1", { EX: LOCK_TIME });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await redis.del(failKey(admin._id.toString()));

    const accessToken  = createAccessToken(admin);
    const refreshToken = createRefreshToken(admin);

    const adminId = admin._id.toString();
    const key = refreshKey(adminId);
    await redis.sAdd(key, refreshToken);
    await redis.expire(key, REFRESH_TTL);
    await redis.del(refreshPrevKey(adminId));

    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ message: "Admin logged in" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.uf_admin_rt;
    if (!token) {
      return res.status(401).json({ message: "Refresh token is missing" });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const adminId = payload.sub?.toString();
    if (!adminId) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const key = refreshKey(adminId);
    const prevKey = refreshPrevKey(adminId);
    const [exists, prevToken] = await Promise.all([
      redis.sIsMember(key, token),
      redis.get(prevKey)
    ]);
    if (!exists && prevToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const admin = await User.findById(adminId).select("_id email role name");
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken  = createAccessToken(admin);
    const newRefreshToken = createRefreshToken(admin);

    // Rotation with a short grace token window to prevent race-related refresh failures.
    await redis.sRem(key, token);
    await redis.sAdd(key, newRefreshToken);
    await redis.expire(key, REFRESH_TTL);
    await redis.set(prevKey, token, { EX: REFRESH_GRACE_TTL });

    setAuthCookies(res, newAccessToken, newRefreshToken);
    return res.json({ message: "Token refreshed" });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const token = req.cookies?.uf_admin_rt;

    if (token) {
      let payload: jwt.JwtPayload | null = null;
      try {
        payload = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
      } catch {
        payload = null;
      }

      const adminId = payload?.sub?.toString();
      if (adminId) {
        await Promise.all([
          redis.sRem(refreshKey(adminId), token),
          redis.del(refreshPrevKey(adminId))
        ]);
      }
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: "Admin logged out successfully" });
  } catch (err) {
    console.error("admin logout error:", err);
    return res.status(500).json({ message: "Something wrong while logout admin" });
  }
};

// ✅ FIX: sessionCheck reads the refresh token cookie directly —
//    it must NOT be placed behind the access-token auth middleware.
export const sessionCheck = async (req, res) => {
  try {
    const token = req.cookies?.uf_admin_rt;
    if (!token) {
      return res.json({ loggedIn: false });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET) as jwt.JwtPayload;
    } catch {
      return res.json({ loggedIn: false });
    }

    const adminId = payload.sub?.toString();
    if (!adminId) {
      return res.json({ loggedIn: false });
    }

    const [exists, prevToken] = await Promise.all([
      redis.sIsMember(refreshKey(adminId), token),
      redis.get(refreshPrevKey(adminId))
    ]);
    if (!exists && prevToken !== token) {
      return res.json({ loggedIn: false });
    }

    return res.json({
      loggedIn: true,
      admin: {
        id:    payload.sub,
        email: payload.email,
        role:  payload.role
      }
    });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(500).json({ loggedIn: false });
  }
};
