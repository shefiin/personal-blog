import Category from '../models/category.model.js'
import { uploadImage } from "../config/cloudinary.js";


export const createCategory = async (req, res) => {
    try {
        const {name, slug, parentId, isActive} = req.body;

        if (!name || !slug) {
            return res.status(400).json({ 
                message: "Name and slug are required" 
            });
        }

        if(!req.file){
            return res.status(400).json({
                message: "Category image is required"
            });
        }    

        const category = await Category.create({
            name,
            slug,
            parentId: parentId || null,
            isActive: isActive !== undefined ? isActive : true,
            image: {url: null, alt: name}
        });

        const imageUrl = await uploadImage(req.file.buffer, "urbanfresh/categories");

        category.image.url = imageUrl
        await category.save();

        res.status(201).json({
            message: "Category created successfully",
            category
        });

    } catch (error) {
        console.error(error);
    
        if (error.code === 11000) {
          return res.status(409).json({ message: "Slug already exists" });
        }

        res.status(500).json({
            message: "Internal server error"
        });
    }    
};


