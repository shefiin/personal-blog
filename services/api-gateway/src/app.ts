import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { authProxy } from "./proxies/auth.proxy.js";
import { storeProxy } from "./proxies/store.proxy.js";
import { requireAdmin } from "./middlewares/requireAdmin.js";
import { requireUser } from "./middlewares/requireUser.js";
import { productProxy } from "./proxies/product.proxy.js";
import { blogProxy } from "./proxies/blog.proxy.js";

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



app.use("/api/auth", authProxy);


app.use("/api/blog/saved-posts", requireUser, blogProxy);
app.use("/api/blog/posts/:id/engagement", requireUser, blogProxy);
app.use("/api/blog/posts/:id/like", requireUser, blogProxy);
app.use("/api/blog/posts/:id/save", requireUser, blogProxy);
app.use("/api/blog/posts/:id/comments", requireUser, blogProxy);
app.use("/api/blog/posts/:id/comments/:commentId", requireUser, blogProxy);
app.use("/api/blog/posts/:id/comments/:commentId/like", requireUser, blogProxy);
app.use("/api/blog/posts/:id/comments/:commentId/replies", requireUser, blogProxy);

//Blog(public)
app.use("/api/blog", blogProxy);


//Blog(admin)
app.use("/api/admin/blog", requireAdmin(), blogProxy);



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
