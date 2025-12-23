import mongoose from "mongoose";

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Store Service DB connected");
    } catch(err){
        console.error("Store DB connection failed", err);
        process.exit(1);
    }
};

export default connectDB;