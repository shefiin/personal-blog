import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/code-context-auth";
        if (mongoUrl.includes("<db_username>") || mongoUrl.includes("<db_password>") || mongoUrl.includes("<cluster-host>")) {
            throw new Error("MONGO_URL still contains placeholders. Replace with your real Mongo URI.");
        }
        await mongoose.connect(mongoUrl);
        console.log("Auth Service DB Connected");
    } catch(err){
        console.error("Auth DB Error", err);
        process.exit(1)
    }
};
