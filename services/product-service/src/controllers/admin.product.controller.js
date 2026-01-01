import Product from "../models/product.model.js";
import { uploadImage } from "../config/cloudinary.js";


export const createProduct = async (req, res) => {
    try {
        const { name, slug, brandId, categoryId, barcode, unit, description, status } = req.body;

        if(!req.files || req.files.length === 0){
            return res.status(400).json({ message: "Product image is required" });
        }

        const product = await Product.create({
            name,
            slug,
            brandId,
            categoryId,
            barcode,
            unit,
            description,
            status,
        });

        const imageUrl = await Promise.all(
            req.files.map((file, index) => 
                uploadImage(file.buffer, "urbanfresh/products")
                    .then(url => ({
                        url,
                        isPrimary: index === 0
                    }))
            )
        );

        product.images = imageUrl
        await product.save();

        res.status(201).json({
            message: "Product created successfully",
            product
        })
    } catch(error){
        if(error.code === 11000){
            return res.status(409).json({
                message: "Barcode or slug already exists"
            })
        }

        res.status(500).json({
            message: "Internal server error from product"
        })
    }
};