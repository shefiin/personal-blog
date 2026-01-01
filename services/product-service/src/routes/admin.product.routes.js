import { Router } from "express";
import { attachUserFromHeaders } from "../middleware/attachUserFromHeader.js";
import { upload } from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createProductSchema } from "../validators/SchemaValidators.js";
import { createProduct } from "../controllers/admin.product.controller.js";


const router = Router();
router.use(attachUserFromHeaders);

router.post("/add", upload.array("images", 12), validateRequest(createProductSchema), createProduct)

export default router;