import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import connectDB from './config/db.js';
import storeRoutes from './routes/store.routes.js';
import { attachUserFromHeaders } from './middlewares/attachUserFromHeader.js';


dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

connectDB();

app.use(attachUserFromHeaders);

app.use("/", storeRoutes);


const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
    console.log(`Store Service running on port ${PORT}`);
})
