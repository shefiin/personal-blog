import mongoose from 'mongoose';
const StoreProductSchema = new mongoose.Schema({
    storeId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    sku: { type: String, required: true },
    title: String,
    price: { type: Number, required: true },
    mrp: Number,
    discountPercent: Number,
    stock: Number,
    warehouseStocks: [{ warehouseId: String, stock: Number }],
    badges: [String],
    availability: { type: Boolean, default: true },
    images: [String],
    attributes: {},
    shippingWeight: Number,
    gstRate: Number,
    createdAt: Date,
    updatedAt: Date
});

StoreProductSchema.index({ storeId: 1, sku: 1 }, { unique: true });
export default mongoose.model('StoreProduct', StoreProductSchema);

