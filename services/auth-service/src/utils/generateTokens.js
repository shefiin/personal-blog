import jwt from "jsonwebtoken";


export const generateAccessToken = (user) => {
    console.log("JWT_KEY in auth:", process.env.JWT_KEY);
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