import jwt from "jsonwebtoken";
import redis from "../config/redis.js"

export const generateAccessToken = (user) => {
    return jwt.sign(
        {id: user._id, email: user.email, role: user.role },
        process.env.JWT_KEY,
        {expiresIn: "15m"}
    );
};

export const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    
    return refreshToken;
};