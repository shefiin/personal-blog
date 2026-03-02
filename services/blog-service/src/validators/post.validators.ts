import Joi from "joi";

const status = Joi.string().valid("draft", "published");

export const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180).required(),
  excerpt: Joi.string().allow("").max(400).default(""),
  content: Joi.string().trim().min(10).required(),
  coverImage: Joi.string().uri().allow("").default(""),
  tags: Joi.array().items(Joi.string().trim().min(1).max(30)).default([]),
  status: status.default("draft")
});

export const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180),
  excerpt: Joi.string().allow("").max(400),
  content: Joi.string().trim().min(10),
  coverImage: Joi.string().uri().allow(""),
  tags: Joi.array().items(Joi.string().trim().min(1).max(30)),
  status
}).min(1);
