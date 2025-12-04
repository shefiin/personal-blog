import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken  } from "../utils/generateTokens.js";
import redis from "../config/redis.js";
import jwt from "jsonwebtoken"


const isProd = process.env.NODE_ENV === "production";

const cookieOptionsAccess = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
    path: "/"
};

const cookieOptionsRefresh = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh"
};

const clearCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/"
  };
  
  const clearCookieRefreshOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth/refresh "
  };
  


export const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refresh_token;
        if(!token) return res.status(401).json({ message: "No refresh token" });

        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

        const userId = decoded.id;

        const storedToken = await redis.get(`refresh:${userId}`);

        if(!storedToken || storedToken !== token) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(userId).select("_id email role name");
        if(!user) return res.status(404).json({ message: "User not found" });

        const newAccessToken = generateAccessToken({user});
        const newRefreshToken = generateRefreshToken({user});

        await redis.set(
            `refresh:${user._id}`,
            newRefreshToken,
            {EX: 7 * 24 * 60 * 60 }
        );

        res.cookie("access_token", newAccessToken, cookieOptionsAccess);
        res.cookie("refresh_token", newRefreshToken, cookieOptionsRefresh);

        res.json({ message: "Token refreshed" });

    } catch(err){
        return res.status(403).json({ message: "Refresh token expired or invalid" });
    }
};


export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exist = await User.findOne({ email });
        if(exist) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashed,
            role: "user"
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await redis.set(
            `refresh:${user._id}`,
            refreshToken,
            {EX: 7 * 24 * 60 * 60 }
        );

        res.cookie("acces_token", accessToken, cookieOptionsAccess);
        res.cookie("refresh_token", refreshToken, cookieOptionsRefresh);

        res.status(201).json({
            message: "User registered",
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch(err){
        res.status(500).json({ message: err.message });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message: "User not found" })

        const match = await bcrypt.compare(password, user.password);
        if(!match) return res.status(400).json({ message: "Invalid password" });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await redis.set(
            `refresh:${user._id}`,
            refreshToken,
            {EX: 7 * 24 * 60 * 60 }
        );

        res.cookie("access_token", accessToken, cookieOptionsAccess);
        res.cookie("refresh_token", refreshToken, cookieOptionsRefresh);

        res.json({
            message: "Login success",
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch(error){
        res.status(500).json({ message: err.message });
    }
};


export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refresh_token;

        if(token){
            const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

            await redis.del(`refresh:${decoded.id}`);
        }

        res.clearCookie("access_token", clearCookieOptions);
        res.clearCookie("refresh_token", clearCookieRefreshOptions);

        return res.json({ message: "Logged out successfully" });

    } catch(error){
        return res.status(500).json({ message: "Logout failed" });
    }
};