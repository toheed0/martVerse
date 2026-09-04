import Category from "../models/Category.js";
import { deleteImage, uploadImage } from "./uploadService.js";

// Multipart bodies arrive as strings, so a checkbox reads "true"/"false"
// rather than a real boolean.
const isTrue = (value) => value === true || value === "true";

export const createCategory = async ({
  name,
  slug,
  description,
  imageFile,
}) => {
  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
  });

  if (existingCategory) {
    throw new Error("Category with this name or slug already exists");
  }

  // Upload only once the name/slug are known to be free — otherwise a rejected
  // create would leave an orphaned asset sitting in Cloudinary.
  const image = imageFile ? await uploadImage(imageFile.buffer) : undefined;

  try {
    const category = await Category.create({
      name,
      slug,
      description,
      ...(image ? { image } : {}),
    });

    return category;
  } catch (error) {
    // The insert failed after the upload succeeded — don't keep the asset.
    if (image) await deleteImage(image.publicId);
    throw error;
  }
};

// Public callers get active categories only. Admin screens pass
// includeInactive so they can see — and reactivate — deactivated ones.
export const getAllCategories = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { status: "active" };

  const categories = await Category.find(filter).sort({ createdAt: -1 });

  return categories;
};

export const getCategoryById = async (categoryId) => {
  const category = await Category.findOne({
    _id: categoryId,
    status: "active",
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const updateCategory = async (
  categoryId,
  { name, slug, description, status, removeImage },
  imageFile
) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      throw new Error("Category name already exists");
    }
  }

  if (slug && slug !== category.slug) {
    const existingCategory = await Category.findOne({
      slug,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      throw new Error("Category slug already exists");
    }
  }

  if (name !== undefined) category.name = name;
  if (slug !== undefined) category.slug = slug;
  if (description !== undefined) category.description = description;
  if (status !== undefined) category.status = status;

  // The asset the save is about to orphan, cleared from Cloudinary only once
  // the document has actually been written.
  const previousPublicId = category.image?.publicId;
  let replacedPublicId = null;

  if (imageFile) {
    category.image = await uploadImage(imageFile.buffer);
    replacedPublicId = previousPublicId;
  } else if (isTrue(removeImage)) {
    category.image = { url: "", publicId: "" };
    replacedPublicId = previousPublicId;
  }

  try {
    await category.save();
  } catch (error) {
    // Roll back the upload so a failed save doesn't leave a stray asset.
    if (imageFile) await deleteImage(category.image?.publicId);
    throw error;
  }

  if (replacedPublicId) await deleteImage(replacedPublicId);

  return category;
};

export const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  if (category.status === "inactive") {
    throw new Error("Category is already inactive");
  }

  category.status = "inactive";

  // Soft delete — the image stays put so Reactivate restores the card intact.
  await category.save();

  return category;
};
