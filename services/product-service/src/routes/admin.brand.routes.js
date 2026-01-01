import { Router } from "express";
import { attachUserFromHeaders } from "../middleware/attachUserFromHeader.js";
import { upload } from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createBrandSchema } from "../validators/SchemaValidators.js";
import { createBrand } from "../controllers/admin.brand.controller.js";

const router = Router();
router.use(attachUserFromHeaders);


router.post("/add", upload.single("logo"), validateRequest(createBrandSchema), createBrand);


export default router;