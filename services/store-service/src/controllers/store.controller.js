import Store from '../models/store.model.js'
import { storeApplySchema } from "../validators/body.validator.js";

export const createStoreApplication = async (req, res) => {
    try{
        const {
            restaurantName,
            ownerName,
            email,
            mobile, 
            phone,
            buildingNumber,
            floor,
            area, 
            city,
            state,
            pincode,
            landmark,
            latitude,
            longitude,
            panNumber,
            gstNumber,
            fssaiNumber,
            bankAccount,
            ifsc
        } = req.body

        const parsed = storeApplySchema.safeParse(req.body);
        if(!parsed.success){
            return res.status(400).json({
                message: "Invalid input",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const ownerId = req.headers["x-user-id"];

        if(!ownerId) return res.status(401).json({ message: "Missing user identity" });

        const lat = Number(latitude);
        const lng = Number(longitude);

        if(!lat || !lng) {
            return res.status(400).json({ message: "Latitude and longitude is required" });
        }

        const store = await Store.create({
            name: restaurantName,
            ownerName,
            ownerId,
            mobile,
            shopContact: {
                phone,
                email
            },
            address: {
                buildingNumber,
                floor,
                area,
                city,
                state,
                pincode,
                landmark,
                geo: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            },
            kycStatus: "pending",
            isActive: false,
            ownerAccountCreated: false,
            documents: {
                pan: {
                    number: panNumber,
                    fileUrl: req.files.panFile[0].path
                },
                gst: {
                    number: gstNumber,
                    fileUrl: req.files.gstFile[0].path
                },
                fssai: {
                    number: fssaiNumber,
                    fileUrl: req.files.fssaiFile[0].path
                },
                bank: {
                    accountNumber: bankAccount,
                    ifsc,
                    fileUrl: req.files.bankFile[0].path
                }
            }
        });

        res.status(201).json({ 
            message: "Store application submitted. Pending verification.",
            store
        });
    } catch(err){
        console.error("error while creating the store", err);
        return res.status(500).json({ message: "Server error" });
    }

};




export const verifyStore = async (req, res) => {
    try {
        const {id} = req.params;

        const store = await Store.findById(id);

        if(!store) return res.status(404).json({
            message: "store don't exist"
        });

        if (store.status !== "pending") {
            return res.status(400).json({
              message: `Store cannot be approved from '${store.status}' state`
            });
        };

        store.status = "approved";
        await store.save();

        return res.status(200).json({
            message: "Store approved successfully",
            store: {
              id: store._id,
              status: store.status
            }
        });
      
    } catch (error) {
        console.error("Verify store error:", error);
        return res.status(500).json({
          message: "Internal server error"
        });
    }
}