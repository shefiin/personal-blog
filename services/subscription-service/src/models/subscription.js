import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
    storeId: mongoose.Schema.Types.ObjectId,
    planId: String,
    status: {
        type: String,
        enum: ['active','past_due','cancelled']
    },
    nextBillingDate: Date,
    stripeSubscriptionId: String,
    createdAt: Date, 
    updatedAt: Date
});

export default mongoose.model('Subscription', SubscriptionSchema);