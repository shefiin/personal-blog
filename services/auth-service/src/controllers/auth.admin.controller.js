import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import redis from "../config/redis.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import { getAdminCookieOptions, clearAdminCookies } from "../utils/AdminCookies.js";
import jwt from "jsonwebtoken";


const isProd = process.env.NODE_ENV === "production";
const { accessOption, refreshOption } = getAdminCookieOptions(isProd);


const  ADMIN_LOGIN_LIMIT = 5;
const ADMIN_LOCK_TIME = 10 * 60;

export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await User.findOne({ email });

        if(!admin || admin.role !== "admin" ){
            return res.status(401).json({ message: "Invalid credentials" });          
        }

        const locked = await redis.get(`admin:locked:${admin._id}`);

        if(locked){
            return res.status(403).json({
                message: "Account is locked due to failed attempts. try again later."
            });
        }

        const isMatch = bcrypt.compare(password, admin.password)

        if(!isMatch){
            const attempts = await redis.incr(`admin:fail:${admin._id}`);

            if(attempts === 1){
                await redis.expire(`admin:fail:${admin._id}`, ADMIN_LOCK_TIME)
            }

            if (attempts >= ADMIN_LOGIN_LIMIT) {
                await redis.set(
                    `admin:locked:${admin._id}`,
                    "1",
                    { EX: ADMIN_LOCK_TIME }
                );
            }

            return res.status(401).json({ message: "Invalid credentials" });
        }

        await redis.del(`admin:fail:${admin._id}`);

        const accessToken = generateAccessToken(admin);
        const refreshToken = generateRefreshToken(admin);

        await redis.set(
            `admin:rt:${admin._id}`,
            refreshToken,
            { EX: 7 * 24 * 60 * 60 }
        );
              
        res.cookie("uf_admin_at", accessToken, accessOption);
        res.cookie("uf_admin_rt", refreshToken, refreshOption);

        res.json({ message: "Admin logged in successfully "});
    } catch(err){
        console.error("Admin login error:", err);
        res.status(500).json({ message: "Sever error" });
    }
};


export const refreshToken = async (req, res) => {
    try{
        const token = req.cookies?.uf_admin_rt;

        if(!token)
            return res.status(401).json({ message: "You are not allowed to send this request since token is missing" });

        let payload;

        try{
            payload = jwt.verify(token, process.env.REFRESH_SECRET)
        } catch(err){
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const key = `admin:rt:${payload.id}`;
        const storedToken = await redis.get(key);

        const adminId = payload.id;

        const admin = await User.findById(adminId).select("_id email role name");

        if(!storedToken){
            return res.status(401).json({ message: "session expired "});
        }

        if(storedToken !== token){
            return res.status(403).json({ message: "Invalid refresh token"});
        }

        const newRefreshToken = generateRefreshToken(admin);

        await redis.set(key, newRefreshToken, {EX: 7 * 24 * 60 * 60});

        const newAccessToken = generateAccessToken(admin);

        res.cookie("uf_admin_at", newAccessToken, accessOption);
        res.cookie("uf_admin_rt", newRefreshToken, refreshOption);

        res.json({ message: "Admin token refreshed" });

    } catch(error){
        console.error("Admin refresh error:", error);
        res.status(500).json({ message: "Server error"})
    }
}


export const adminLogout = async (req, res) => {
    try {
        const token = req.cookies?.uf_admin_rt;

        if(!token){
            clearAdminCookies(res)
            res.status(200).json({ message: "Admin logged out successfully" });
        }

        let payload;

        try{
            payload = jwt.verify(token, process.env.REFRESH_SECRET)
        } catch(err){
            clearAdminCookies(res)
            res.status(200).json({ message: "Admin logged out successfully" })
        }

        const adminId = payload.id;
        await redis.del(`admin:rt${adminId}`);

        clearAdminCookies(res);

        return res.status(200).json({ message: "Admin logged out successfully" });

    } catch(err){
        console.err("admin logout error:", err); 
        return res.status(500).json({ message: "something wrong while logout admin" })
    }
};


export const sessionCheck = async (req, res) => {
    try {
        const token = req.cookies?.uf_admin_rt;

        if(!token){
            return res.json({ loggedIn: false })
        }

        let payload;

        try {
            payload = jwt.verify(token, process.env.REFRESH_SECRET)
        } catch(err){
            return res.json({ loggedIn: false });
        }

        const storedRT = await redis.get(`admin:rt:${payload.id}`)
        if(!storedRT){
            return res.json({ loggedIn: false });
        }

        return res.json({ 
            loggedIn: true,
            admin: {
                id: payload.id,
                email: payload.email,
                role: payload.role
            }
        });

    } catch (err) {
        console.error("Session check error:", err);
        return res.status(500).json({ loggedIn: false });
    }
};