import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL is missing. Set it in services/auth-service/.env");
        }
        if (mongoUrl.includes("<db_username>") || mongoUrl.includes("<db_password>") || mongoUrl.includes("<cluster-host>")) {
            throw new Error("MONGO_URL still contains placeholders. Replace with your real Atlas URI.");
        }
        await mongoose.connect(mongoUrl);
        console.log("Auth Service DB Connected");
    } catch(err){
        console.error("Auth DB Error", err);
        process.exit(1)
    }
};
