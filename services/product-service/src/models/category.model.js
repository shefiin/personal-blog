import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    image: {
        url: { type: String, default: null },
        alt: { type: String }
    },
    isActive: {
        type: Boolean,
        default: true
      }
},
    { timestamps: true }
);

export default mongoose.model("Category", CategorySchema);



