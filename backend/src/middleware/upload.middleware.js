import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// A product carries a small gallery, a category a single piece of art.
const MAX_PRODUCT_IMAGES = 5;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

// memoryStorage keeps the file as a Buffer we can stream straight to
// Cloudinary — nothing ever touches this server's disk.
const parserFor = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: maxFiles },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(
          new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed")
        );
      }
      cb(null, true);
    },
  });

// Multer's own failures are all user errors — a file too big, too many of
// them, the wrong field name. Left alone they land on the generic 500 handler
// and read like the server broke, so they are translated here instead.
const describe = (error) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return "Each image must be 5MB or smaller";
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return `You can upload at most ${MAX_PRODUCT_IMAGES} images at a time`;
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return `Unexpected file field "${error.field}"`;
  }

  return error.message;
};

const handle = (parser) => (req, res, next) =>
  parser(req, res, (error) => {
    if (!error) return next();

    return res.status(400).json({ success: false, message: describe(error) });
  });

export const uploadCategoryImage = handle(parserFor(1).single("image"));

export const uploadProductImages = handle(
  parserFor(MAX_PRODUCT_IMAGES).array("images", MAX_PRODUCT_IMAGES)
);
