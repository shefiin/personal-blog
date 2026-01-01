import Joi from "joi";


export const createCategorySchema = Joi.object({
    name: Joi.string().trim().required(),
    slug: Joi.string().trim().required(),
    parentId: Joi.string().optional().allow(null, ""),
    isActive: Joi.boolean().optional()
});


export const createBrandSchema = Joi.object({
    name: Joi.string().trim().required(),
    slug: Joi.string().trim().required(),
    isActive: Joi.boolean().optional()
});


export const createProductSchema = Joi.object({
  name: Joi.string().trim().required(),
  slug: Joi.string().trim().required(),
  brandId: Joi.string().required(),
  categoryId: Joi.string().required(),
  barcode: Joi.string().required(),
  unit: Joi.string().required(),
  description: Joi.string().trim(),
  status: Joi.string().trim()
});
