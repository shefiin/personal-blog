import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Auth Service DB Connected");
    } catch(err){
        console.error("Auth DB Error", err);
        process.exit(1)
    }
};