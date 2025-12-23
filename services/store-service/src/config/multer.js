import multer from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads")

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({ storage });