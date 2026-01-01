import mongoose from 'mongoose';

const StoreProductSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
      },
  
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
      },
  
      mrp: {
        type: Number,
        required: true,
        min: 0
      },
  
      sellingPrice: {
        type: Number,
        required: true,
        min: 0
      },
  
      stock: {
        type: Number,
        required: true,
        min: 0
      },
  
      isAvailable: {
        type: Boolean,
        default: true
      },
  
      isListed: {
        type: Boolean,
        default: true
      },
  
      lowStockThreshold: {
        type: Number,
        default: 5
      }
    },
    {
      timestamps: true
    }
);
  
StoreProductSchema.index({ storeId: 1, productId: 1 }, { unique: true });

export default mongoose.model('StoreProduct', StoreProductSchema);

