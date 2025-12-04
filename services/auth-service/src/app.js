import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import userAuthRoutes from "./routes/auth.user.routes.js";
import adminAuthRoutes from "./routes/auth.admin.routes.js"


dotenv.config();
const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", userAuthRoutes);
app.use("/api/admin/auth", adminAuthRoutes)


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`))