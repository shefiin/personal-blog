import { Router } from "express";
import { addCommentReply, addPostComment, deletePostComment, getPostEngagement, getPublishedPostBySlug, listPublishedPosts, listSavedPosts, toggleCommentLike, togglePostLike, togglePostSave, updatePostComment } from "../controllers/post.controller.js";

const router = Router();

router.get("/posts", listPublishedPosts);
router.get("/saved-posts", listSavedPosts);
router.get("/posts/:slug", getPublishedPostBySlug);
router.get("/posts/:id/engagement", getPostEngagement);
router.post("/posts/:id/like", togglePostLike);
router.post("/posts/:id/save", togglePostSave);
router.post("/posts/:id/comments", addPostComment);
router.patch("/posts/:id/comments/:commentId", updatePostComment);
router.delete("/posts/:id/comments/:commentId", deletePostComment);
router.post("/posts/:id/comments/:commentId/like", toggleCommentLike);
router.post("/posts/:id/comments/:commentId/replies", addCommentReply);

export default router;
