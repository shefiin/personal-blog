import mongoose from "mongoose";

const ProductImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
}, { _id: false });

const ProductSchema = new mongoose.Schema(
    {
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
  
      brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
        index: true
      },
  
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
      },
  
      barcode: {
        type: String,
        required: true,
        unique: true,
        index: true
      },
  
      unit: {
        type: String, 
        required: true
      },
  
      attributes: {
        type: Map,
        of: String
      },
  
      images: {
        type: [ProductImageSchema],
        default: []
      },
  
      description: {
        type: String
      },
  
      regulatory: {
        fssai: String,
        manufacturer: String,
        shelfLife: String,
        storageInstructions: String
      },
      
      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
      }
    },
    { timestamps: true }
);

ProductSchema.index({ barcode: 1 }, { unique: true });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });
  
export default mongoose.model("Product", ProductSchema);