import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

// memoryStorage keeps the file as a Buffer we can stream straight to
// Cloudinary — nothing ever touches this server's disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed"));
    }
    cb(null, true);
  },
});

// Wraps the single-file parser so multer's own errors (file too big, wrong
// type) come back as a clean 400 instead of hitting the generic 500 handler.
export const uploadCategoryImage = (req, res, next) =>
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : error.message;

    return res.status(400).json({ success: false, message });
  });

export default upload;
