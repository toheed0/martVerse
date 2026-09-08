import { createProduct, deleteProduct, getAllProducts, getProductById, getVendorProducts, updateProduct } from "../services/productService.js";

export const createProductController = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      stock,
      images,
    } = req.body;

    if (!categoryId || !name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Category, name, description and price are required",
      });
    }

    const product = await createProduct({
      vendorId: req.user._id,
      categoryId,
      name,
      description,
      price,
      stock,
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllProductsController = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
    } = req.query;

    const result = await getAllProducts({
      page,
      limit,
      search,
      categoryId,
      minPrice: minPrice !== undefined
        ? Number(minPrice)
        : undefined,
      maxPrice: maxPrice !== undefined
        ? Number(maxPrice)
        : undefined,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyProductsController = async (req, res) => {
  try {
    const products = await getVendorProducts(req.user._id);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getProductById(id);

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await updateProduct(
      id,
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await deleteProduct(
      id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};