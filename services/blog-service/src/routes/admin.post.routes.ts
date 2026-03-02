import { Router } from "express";
import {
  createPost,
  deletePost,
  getAdminPostById,
  listAdminPosts,
  updatePost
} from "../controllers/post.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { createPostSchema, updatePostSchema } from "../validators/post.validators.js";

const router = Router();

router.get("/posts", listAdminPosts);
router.get("/posts/:id", getAdminPostById);
router.post("/posts", validateRequest(createPostSchema), createPost);
router.patch("/posts/:id", validateRequest(updatePostSchema), updatePost);
router.delete("/posts/:id", deletePost);

export default router;
