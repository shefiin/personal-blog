import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { authProxy } from "./proxies/auth.proxy.js";
import { storeProxy } from "./proxies/store.proxy.js";
import { requireAdmin } from "./middlewares/requireAdmin.js";
import { requireUser } from "./middlewares/requireUser.js";
import { productProxy } from "./proxies/product.proxy.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});



//user auth
app.use("/api/auth", authProxy);



//admin auth 
app.use("/api/admin/auth", authProxy);



//Store(user)
app.use("/api/store", requireUser, storeProxy);



//Store(admin)
app.use("/api/admin/store", requireAdmin(), storeProxy);



//Product(admin)
app.use("/api/admin/products", requireAdmin(), productProxy);
app.use("/api/admin/categories", requireAdmin(), productProxy);
app.use("/api/admin/brands", requireAdmin(), productProxy);




const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});



















