import Post from "../models/post.model.js";
import { uploadImageBuffer } from "../config/cloudinary.js";

const serializeReply = (reply: any) => ({
  id: String(reply._id),
  userId: reply.userId,
  userName: reply.userName,
  text: reply.text,
  createdAt: reply.createdAt
});

const serializeComment = (comment: any) => ({
  id: String(comment._id),
  userId: comment.userId,
  userName: comment.userName,
  text: comment.text,
  createdAt: comment.createdAt,
  likeCount: Array.isArray(comment.likedBy) ? comment.likedBy.length : 0,
  replyCount: Array.isArray(comment.replies) ? comment.replies.length : 0,
  replies: Array.isArray(comment.replies) ? comment.replies.map(serializeReply) : []
});

const serializePost = (post: any) => {
  const data = post.toObject ? post.toObject() : post;
  const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
  const savedBy = Array.isArray(data.savedBy) ? data.savedBy : [];
  const comments = Array.isArray(data.comments) ? data.comments.map(serializeComment) : [];

  return {
    ...data,
    comments,
    likeCount: likedBy.length,
    saveCount: savedBy.length,
    commentCount: comments.length
  };
};

const buildSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const uniqueSlug = async (title: string, ignoreId: string | null = null) => {
  const base = buildSlug(title);
  const seed = base || `post-${Date.now()}`;
  let slug = seed;
  let counter = 1;

  while (true) {
    const existing = await Post.findOne({ slug });
    if (!existing || (ignoreId && String(existing._id) === ignoreId)) {
      return slug;
    }
    counter += 1;
    slug = `${seed}-${counter}`;
  }
};

const normalizeTags = (tags = []) => {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
};

export const createPost = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, tags, status } = req.body;
    const slug = await uniqueSlug(title);
    const isPublished = status === "published";

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags: normalizeTags(tags),
      status,
      publishedAt: isPublished ? new Date() : null,
      authorId: req.headers["x-user-id"] || "unknown-admin",
      authorEmail: req.headers["x-user-email"] || "",
      likedBy: [],
      savedBy: [],
      comments: []
    });

    return res.status(201).json(serializePost(post));
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ message: "Failed to create post" });
  }
};

export const listPublishedPosts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;
    const tag = req.query.tag ? String(req.query.tag).toLowerCase() : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    const filter: any = { status: "published" };
    if (tag) {
      filter.tags = tag;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter)
    ]);

    return res.json({
      items: items.map((item) => serializePost(item)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    console.error("List posts error:", err);
    return res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const listSavedPosts = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const items = await Post.find({
      status: "published",
      savedBy: userId
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.json({
      items: items.map((item) => serializePost(item))
    });
  } catch (err) {
    console.error("List saved posts error:", err);
    return res.status(500).json({ message: "Failed to fetch saved posts" });
  }
};

export const getPublishedPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug, status: "published" }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(serializePost(post));
  } catch (err) {
    console.error("Get post error:", err);
    return res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const listAdminPosts = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status) : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    const filter: any = {};
    if (status && ["draft", "published"].includes(status)) {
      filter.status = status;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter)
    ]);

    return res.json({
      items: items.map((item) => serializePost(item)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    console.error("Admin list posts error:", err);
    return res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const getAdminPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(serializePost(post));
  } catch (err) {
    console.error("Admin get post error:", err);
    return res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const payload = req.body;
    if (payload.title && payload.title !== post.title) {
      payload.slug = await uniqueSlug(payload.title, String(post._id));
    }
    if (payload.tags) {
      payload.tags = normalizeTags(payload.tags);
    }
    if (payload.status === "published" && !post.publishedAt) {
      payload.publishedAt = new Date();
    }
    if (payload.status === "draft") {
      payload.publishedAt = null;
    }

    Object.assign(post, payload);
    await post.save();

    return res.json(serializePost(post));
  } catch (err) {
    console.error("Update post error:", err);
    return res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ message: "Failed to delete post" });
  }
};

export const uploadPostImage = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ message: "Cloudinary is not configured" });
    }

    const file = (req as any).file as { buffer: Buffer } | undefined;
    if (!file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const result = await uploadImageBuffer(file.buffer, process.env.CLOUDINARY_FOLDER || "code-context");
    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error("Upload image error:", err);
    return res.status(500).json({ message: "Failed to upload image" });
  }
};

export const getPostEngagement = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = String(req.headers["x-user-id"] || "");
    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const savedBy = Array.isArray(post.savedBy) ? post.savedBy : [];
    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];

    return res.json({
      liked: userId ? likedBy.includes(userId) : false,
      saved: userId ? savedBy.includes(userId) : false,
      likeCount: likedBy.length,
      saveCount: savedBy.length,
      commentCount: comments.length,
      comments
    });
  } catch (err) {
    console.error("Get post engagement error:", err);
    return res.status(500).json({ message: "Failed to fetch post engagement" });
  }
};

export const togglePostLike = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const alreadyLiked = likedBy.includes(userId);
    post.likedBy = alreadyLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId];
    await post.save();

    return res.json({
      liked: !alreadyLiked,
      likeCount: post.likedBy.length
    });
  } catch (err) {
    console.error("Toggle like error:", err);
    return res.status(500).json({ message: "Failed to update like" });
  }
};

export const togglePostSave = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const savedBy = Array.isArray(post.savedBy) ? post.savedBy : [];
    const alreadySaved = savedBy.includes(userId);
    post.savedBy = alreadySaved ? savedBy.filter((id: string) => id !== userId) : [...savedBy, userId];
    await post.save();

    return res.json({
      saved: !alreadySaved,
      saveCount: post.savedBy.length
    });
  } catch (err) {
    console.error("Toggle save error:", err);
    return res.status(500).json({ message: "Failed to update save" });
  }
};

export const addPostComment = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    const userName = String(req.headers["x-user-name"] || "Reader");
    const text = String(req.body?.text || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.unshift({
      userId,
      userName,
      text,
      likedBy: [],
      replies: []
    } as any);
    await post.save();

    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];
    return res.status(201).json({
      comments,
      commentCount: comments.length
    });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ message: "Failed to add comment" });
  }
};

export const updatePostComment = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    const text = String(req.body?.text || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (String(comment.userId) !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    comment.text = text;
    await post.save();

    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];
    return res.json({
      comments,
      commentCount: comments.length
    });
  } catch (err) {
    console.error("Update comment error:", err);
    return res.status(500).json({ message: "Failed to update comment" });
  }
};

export const deletePostComment = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (String(comment.userId) !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    comment.deleteOne();
    await post.save();

    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];
    return res.json({
      comments,
      commentCount: comments.length
    });
  } catch (err) {
    console.error("Delete comment error:", err);
    return res.status(500).json({ message: "Failed to delete comment" });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
    const alreadyLiked = likedBy.includes(userId);
    comment.likedBy = alreadyLiked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId];
    await post.save();

    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];
    return res.json({
      comments,
      commentCount: comments.length
    });
  } catch (err) {
    console.error("Toggle comment like error:", err);
    return res.status(500).json({ message: "Failed to update comment like" });
  }
};

export const addCommentReply = async (req, res) => {
  try {
    const userId = String(req.headers["x-user-id"] || "");
    const userName = String(req.headers["x-user-name"] || "Reader");
    const text = String(req.body?.text || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!text) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.replies.unshift({
      userId,
      userName,
      text
    } as any);
    await post.save();

    const comments = Array.isArray(post.comments) ? post.comments.map(serializeComment) : [];
    return res.status(201).json({
      comments,
      commentCount: comments.length
    });
  } catch (err) {
    console.error("Add comment reply error:", err);
    return res.status(500).json({ message: "Failed to add reply" });
  }
};
