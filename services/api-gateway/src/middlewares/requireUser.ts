import jwt from 'jsonwebtoken';

export const requireUser = (req, res, next) => {
    try{
        const authHeader = req.headers["authorization"];
        const tokenFromHeader = 
            authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        const token = req.cookies?.access_token || tokenFromHeader

        if(!token) {
            return res.status(401).json({
                message: "Unauthorized: No access token" 
            });
        }

        const payload = jwt.verify(token, process.env.JWT_KEY) as jwt.JwtPayload;

        req.headers["x-user-id"] = payload.sub;
        req.headers["x-user-email"] = payload.email;
        req.headers["x-user-role"] = payload.role;

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
