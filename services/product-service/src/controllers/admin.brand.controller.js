import Brand from '../models/brands.model.js'
import { uploadImage } from '../config/cloudinary.js';

export const createBrand = async(req, res) => {
    try {
        const { name, slug, isActive } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Brand logo is required" });
        }

        const brand = await Brand.create({
            name,
            slug,
            isActive: isActive !== undefined ? isActive : true,
            logo: { url: null, alt: name }
        });

        const logoUrl = await uploadImage(
            req.file.buffer,
            "urbanfresh/brands"
        );

        brand.logo.url = logoUrl;
        await brand.save();
      
        res.status(201).json({
            message: "Brand created successfully",
            brand
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Slug already exists" });
        }
    
        res.status(500).json({ message: "Internal server error" });
    }
};

