import mongoose from "mongoose";


const variantSchema = mongoose.Schema({
    name: String,
    sku: String,
    mrp: Number,
    sellingPrice: Number,
    discountPercent: Number,
    stock: Number,
    barcode: String,
    image: String
}, { _id: false })


const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: { 
        type: String, 
        unique: true 
    },   
    brand: {
        id: mongoose.Schema.Types.ObjectId,
        name: String
    },
    category: {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        parent: String          
    },
    price: {
        category: Number,
        required: true
    },
    description: {
        type: String
    },

    shortDescription: String,
    images: [{type: String}],
    variants: [variantSchema],
    unit: String,                 
    tags: [String], 

    fulfillment: {
        isInStock: { type: Boolean, default: true },
        warehouseStock: Number,   
        restockDate: Date         
    },
    pricing: {
        avgSellingPrice: Number,  
        lowestPrice30Days: Number,
        highestPrice30Days: Number
    },

    delivery: {
        deliveryTime: String,     
        deliveryCharge: Number,   
        maxQuantityPerOrder: Number
    },

    regulatory: {
        fssaiLicense: String,
        manufacturerDetails: String,
        shelfLife: String,        
        storageInstructions: String,
    },

    attributes: {
        color: String,
        material: String,
        expiryDate: Date,
        packagingType: String     
    },

    rating: {
        stars: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },

    status: {
        type: String,
        enum: ["active", "inactive", "deleted"],
        default: "active"
    },

    isFeatured: { type: Boolean, default: false }, 
    isBestSeller: { type: Boolean, default: false },

    metadata: {
        createdBy: String,
        updatedBy: String
    },
    weight: Number, 
},
{ timestamps: true });

export default mongoose.model("Product", productSchema);



