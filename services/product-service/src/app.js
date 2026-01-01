import express from "express"
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { connectDB } from './config/db.js';
import adminProductRoutes from './routes/admin.product.routes.js';
import adminCategoryRoutes from './routes/admin.category.routes.js';
import adminBrandRoutes from './routes/admin.brand.routes.js';



dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

connectDB();


//User
// app.use("/api/product", productRoutes);


//Admin
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/brands", adminBrandRoutes);


const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`Store Service running on port ${PORT}`);
})
