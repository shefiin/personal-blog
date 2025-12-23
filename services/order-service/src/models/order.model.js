import mongoose, { mongo } from "mongoose";

const OrderSchema = new mongoose.Schema({
    OrderNumber: String,
    customerId: mongoose.Schema.Types.ObjectId,
    storeId: mongoose.Schema.Types.ObjectId,
    items: [{
        sku: String,
        storeProductId: mongoose.Schema.Types.ObjectId,
        qty: Number,
        price: Number
    }],
    subtotal: Number,
    deliveryCharge: Number,
    taxes: Number,
    total: Number,
    payment: { provider: String, status: String, transactionId: String},
    status: {
        type: String,
        enum: ['created','confirmed','packed','out_for_delivery','delivered','cancelled']
    },
    createdAt: Date, 
    updatedAt: Date
});

export default mongoose.model('Order', OrderSchema);
