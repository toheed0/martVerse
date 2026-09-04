import { createCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from "../services/categoryService.js";

export const createCategoryController = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    const category = await createCategory({
      name,
      slug,
      description,
      // Present only when the admin picked a file; multer put it here.
      imageFile: req.file,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCategoriesController = async (req, res) => {
  try {
    const categories = await getAllCategories();

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCategoriesAdminController = async (req, res) => {
  try {
    const categories = await getAllCategories({ includeInactive: true });

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoryByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await getCategoryById(id);

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await updateCategory(id, req.body, req.file);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
      category,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
