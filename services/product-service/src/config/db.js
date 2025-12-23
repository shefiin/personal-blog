import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Product Service DB Connected");
    } catch(err){
        console.log("Product DB error:", err);
        process.exit(1);
    }
}