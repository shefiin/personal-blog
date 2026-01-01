import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema({
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
      parentBrandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        default: null
      },
      logo: {
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

export default mongoose.model("Brand", BrandSchema);