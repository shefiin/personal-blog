import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    role: {
        type: String,
        default: "user"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    }
},
{timestamps: true }
);

export default mongoose.model("User", userSchema);
