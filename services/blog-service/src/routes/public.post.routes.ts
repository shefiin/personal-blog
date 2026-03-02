import { Router } from "express";
import { getPublishedPostBySlug, listPublishedPosts } from "../controllers/post.controller.js";

const router = Router();

router.get("/posts", listPublishedPosts);
router.get("/posts/:slug", getPublishedPostBySlug);

export default router;
