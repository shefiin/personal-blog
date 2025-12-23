import jwt from 'jsonwebtoken';

export const requireUser = (req, res, next) => {
    console.log("JWT_KEY in gateway:", process.env.JWT_KEY);
    console.log("COOKIES RECEIVED:", req.cookies);
    console.log("AUTH HEADER:", req.headers.authorization);
    try{

        const authHeader = req.headers["authorization"];
        const tokenFromHeader = authHeader?.startsWith("Bearer") ? authHeader.split(" ")[1] : null;
        const token = req.cookies?.access_token || tokenFromHeader

        if(!token) {
            return res.status(401).json({message: "Unauthorized: No access token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY)

        req.user = decoded;

        req.headers["x-user-id"] = decoded.id;
        req.headers["x-user-email"] = decoded.email;
        req.headers["x-user-role"] = decoded.role;

        next();

    } catch(err){
        console.error("Gateway Auth Error:", err.message);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};