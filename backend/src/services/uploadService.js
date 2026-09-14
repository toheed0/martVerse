import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const CATEGORY_FOLDER = "martverse/categories";

// Kept apart from the category art so the two can be browsed, quota-checked and
// cleaned up independently in the Cloudinary console.
export const PRODUCT_FOLDER = "martverse/products";

// Cloudinary reports a scoped key that can authenticate but isn't allowed to
// upload as a bare "Server returned unexpected status code - 403", which tells
// an admin nothing. Translate the two auth failures into something they can
// act on.
const describeUploadError = (error) => {
  const status = error?.http_code || error?.error?.http_code;

  if (status === 403) {
    return "Cloudinary rejected the upload: this API key is missing upload permissions. Use the master key, or grant this key write access in Settings > API Keys.";
  }

  if (status === 401) {
    return "Cloudinary rejected the credentials. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.";
  }

  return error?.message || "Image upload failed";
};

// Cloudinary's SDK takes a stream, not a Buffer, and multer's memoryStorage
// gives us a Buffer — so pipe one into the other and wrap it in a promise.
export const uploadImage = (buffer, folder = CATEGORY_FOLDER) => {
  if (!isCloudinaryConfigured) {
    const error = new Error(
      "Image uploads are not configured on the server. Add the Cloudinary keys to .env."
    );
    error.statusCode = 503;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Cap what we store: category art never needs more than this, and it
        // keeps both the Cloudinary bill and the page weight down.
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);

          const wrapped = new Error(describeUploadError(error));
          wrapped.statusCode = 502;
          return reject(wrapped);
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
};

// Best-effort: a category save must not fail just because the old asset was
// already gone from Cloudinary.
export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
  }
};
