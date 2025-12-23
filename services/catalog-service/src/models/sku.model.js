import mongoose from "mongoose";

const SKUSchema = new mongoose.Schema({
    sku: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    brand: String,
    category: [String],
    attributes: {},
    images: [String],
    description: String,
    createdAt: Date,
    updatedAt: Date
});
export default mongoose.model('SKU', SKUSchema);
