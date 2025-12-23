import mongoose from "mongoose";


const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point"
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });



const OpenHourSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["mon","tue","wed","thu","fri","sat","sun"]
  },
  open: { type: String, required: true },
  close: { type: String, required: true }
}, { _id: false });



const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerName: {type: String, required: true, trim: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  mobile: {type: String, required: true},

  shopContact: {
    phone: { type: String, required: true },
    email: { type: String }
  },

  address: {
    buildingNumber: { type: String, required: true },
    floor: String,
    area: {type: String, required: true },
    city: { type: String, required: true },
    state: String,
    pincode: { type: String, required: true },
    geo: { type: GeoSchema, required: true }
  },

  deliveryRadiusMeters: { type: Number, default: 3000 },

  openHours: {
    type: [OpenHourSchema],
    default: []
  },

  kycStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },

  documents: {
    pan: {
      number: String,
      fileUrl: String
    },
    gst: {
      number: String,
      fileUrl: String
    },
    fssai: {
      number: String,
      fileUrl: String
    },
    bank: {
      accountNumber: String,
      ifsc: String,
      fileUrl: String 
    }
  },

  branding: {
    logoUrl: { type: String },
    theme: {}
  },

  settings: {
    acceptsOnlinePayments: { type: Boolean, default: true },
    businessType: {
      type: String,
      enum: ["supermarket", "hypermarket", "grocery", "convenience"],
      default: "supermarket"
    }
  },

  isActive: { type: Boolean, default: false },
  ownerAccountCreated: { type: Boolean, default: false }

}, { timestamps: true });

StoreSchema.index({ "address.geo": "2dsphere" });

export default mongoose.model("Store", StoreSchema);