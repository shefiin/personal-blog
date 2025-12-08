import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authProxy } from "./proxies/auth.js";
import { verifyAccessToken } from "./middlewares/verifyJWT.js";
import { requireAdmin } from "./middlewares/requireAdmin.js";

dotenv.config();
const app = express();

app.use(cors());

app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});
  
//User
app.use("/api/auth", authProxy);

//Admin
app.use("/api/admin/auth/login", authProxy); 
app.use("/api/admin/mfa/verify", authProxy);
app.use("/api/admin/auth/refresh", authProxy);
app.use("/api/admin/auth/logout", authProxy);
app.use("/api/admin/auth/session", authProxy);
 
app.use("/api/admin", (req, res, next) => {
    if (req.path.startsWith("/auth")) {
        return next(); 
    }
    return requireAdmin({ allowlist: ["127.0.0.1"] })(req, res, next);
}, authProxy);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);  
});






































