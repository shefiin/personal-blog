import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';


function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_KEY);
}

export function requireAdmin(options = {}) {

    const allowlist = options.allowlist || [];

    return async (req, res, next) => {
        try {
            const token = 
                req.cookies?.uf_admin_at ||
                req.headers["authorization"]?.split(" ")[1];

            if(!token) return res.status(401).json({ message: "Admin token missing from gateway" });
            
            let payload;

            try {
                payload = verifyAccessToken(token);
            } catch(err) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            if(payload.role !== "admin") 
                return res.status(403).json({ message: "Admins only" });

            const locked = await redis.get(`admin:locked:${payload.sub}`);
            if(locked)
                return res.status(403).json({ message: "Admin account locked" });

            if(allowlist.length > 0){
                const ip = req.headers["x-forwaded-for"]?.split(",")[0] || req.ip
                if(!allowlist.includes(ip)){
                    return res.status(403).json({ message: "IP not allowed" });
                }
            }

            req.headers["x-user-id"] = payload.sub;
            req.headers["x-user-role"] = payload.role;
            req.headers["x-user-email"] = payload.email;

            next();

        } catch(error){
            console.error("Admin middleware error:", err);
            res.status(500).json({ message: "Gateway error" });
        }
    };
}