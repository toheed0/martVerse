import mongoose from "mongoose";

// _id: false — this is a plain value object, not something we ever query by id.
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },

    // Kept so we can delete the old asset from Cloudinary when the image is
    // replaced or removed, instead of leaking orphaned uploads.
    publicId: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: imageSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
