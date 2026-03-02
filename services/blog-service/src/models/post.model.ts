import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      default: ""
    },
    content: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    },
    authorId: {
      type: String,
      required: true
    },
    authorEmail: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

PostSchema.index({ createdAt: -1 });

export default mongoose.model("Post", PostSchema);
