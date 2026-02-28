import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';


export function requireAdmin(options = {}) {

    return async (req, res, next) => {
        try {
            const token = 
                req.cookies?.uf_admin_at ||
                req.headers["authorization"]?.split(" ")[1];

            if(!token) {
                return res.status(401).json({ 
                    message: "Admin token missing from gateway" 
                });
            } 
            
            const payload = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;

            if (payload.role !== "admin") {
              return res.status(403).json({ message: "Admins only" });
            }

            const locked = await redis.get(`admin:locked:${payload.sub}`);
            if(locked){
                return res.status(403).json({ 
                    message: "Admin account locked" 
                });
            }
             
            req.headers["x-user-id"] = payload.sub;
            req.headers["x-user-role"] = payload.role;
            req.headers["x-user-email"] = payload.email;

            next();

        } catch(error){
            console.error("Admin middleware error:", error);
            if (
                error.name === "TokenExpiredError" ||
                error.name === "JsonWebTokenError"
            ) {
                return res.status(401).json({ 
                    message: "Invalid or expired admin token" 
                });
              }
            
            return res.status(500).json({ message: "Gateway error" });            
        }
    };
}
