import jwt from 'jsonwebtoken';

export const requireUser = (req, res, next) => {
    try{
        const authHeader = req.headers["authorization"];
        const tokenFromHeader = 
            authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        const accessToken = req.cookies?.uf_user_at || tokenFromHeader;
        const refreshToken = req.cookies?.uf_user_rt;

        let payload: jwt.JwtPayload | null = null;

        if (accessToken) {
            try {
                payload = jwt.verify(accessToken, process.env.JWT_KEY) as jwt.JwtPayload;
            } catch {
                payload = null;
            }
        }

        // Fallback to the user refresh cookie so authenticated reader sessions
        // continue to work even when the short-lived access cookie has expired.
        if (!payload && refreshToken) {
            try {
                payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET) as jwt.JwtPayload;
            } catch {
                payload = null;
            }
        }

        if(!payload) {
            return res.status(401).json({
                message: "Unauthorized: No access token" 
            });
        }
        if (payload.role !== "user") {
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        req.headers["x-user-id"] = payload.sub;
        req.headers["x-user-email"] = payload.email;
        req.headers["x-user-role"] = payload.role;
        req.headers["x-user-name"] = payload.name || "";

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role
        };

        next();

    } catch(err: any){
        console.error("Gateway Auth Error:", err.message);
        return res.status(401).json({ 
            message: "Unauthorized: Invalid or expired token" 
        });
    }
};
