import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import publicPostRoutes from "./routes/public.post.routes.js";
import adminPostRoutes from "./routes/admin.post.routes.js";

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

connectDB();

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "blog-service" });
});

app.use("/api/blog", publicPostRoutes);
app.use("/api/admin/blog", adminPostRoutes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Blog service running on port ${PORT}`);
});
