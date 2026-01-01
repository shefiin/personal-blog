import { Router } from "express";
import { attachUserFromHeaders } from "../middleware/attachUserFromHeader.js";
import { upload } from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createCategorySchema } from "../validators/SchemaValidators.js";
import { createCategory } from "../controllers/admin.category.controller.js";

const router = Router();

router.use(attachUserFromHeaders);



router.post("/add", upload.single("image"), validateRequest(createCategorySchema), createCategory);

export default router;