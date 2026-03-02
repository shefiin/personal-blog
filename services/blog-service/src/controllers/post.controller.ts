import Post from "../models/post.model.js";

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
      authorEmail: req.headers["x-user-email"] || ""
    });

    return res.status(201).json(post);
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
      items,
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

export const getPublishedPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug, status: "published" }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(post);
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
      items,
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
    return res.json(post);
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

    return res.json(post);
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
