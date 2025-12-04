import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
    try {
        const token = req.cookies?.access_token;

        if(!token){
            return res.status(401).json({ message: "Unauthorized. No access token." });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        req.user = decoded;

        req.headers["x-user-id"] = decoded.id;
        req.headers["x-user-email"] = decoded.email;
        req.headers["x-user-role"] = decoded.role;
        
    } catch(error){
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const requireAdmin = (req, res, next) => {
    if(req.headers["x-user-role"] !== "admin"){
        return res.status(403).json({ message: "Admin only access" });
    }
    next();
};

