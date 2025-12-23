import { Router } from "express";
import { createStoreApplication, verifyStore } from "../controllers/store.controller.js";
import { upload } from "../config/multer.js"


const router = Router();


//User
router.post("/apply", upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "gstFile", maxCount: 1 },
    { name: "fssaiFile", maxCount: 1 },
    { name: "bankFile", maxCount: 1 }
]), createStoreApplication);


//Admin
router.patch("/:id/verify", verifyStore)


export default router;

