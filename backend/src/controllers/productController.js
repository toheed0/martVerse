import { uploadImage, PRODUCT_FOLDER } from "../services/uploadService.js";
import { createProduct, deleteProduct, getAllProducts, getProductById, getProductsForAdmin, getVendorProducts, updateProduct } from "../services/productService.js";

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

export const getAdminProductsController = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const {
      search,
      vendorId,
      status,
    } = req.query;

    const result = await getProductsForAdmin({
      page,
      limit,
      search,
      vendorId,
      status,
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
      req.user,
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
      req.user
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
// Uploading is its own endpoint rather than part of create/update. A product
// form holds several images at once, and the vendor needs to see each one land
// before they commit the row — so the picture goes up first and the save that
// follows is the same plain JSON it always was.
export const uploadProductImagesController = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({
        success: false,
        message: "No image was uploaded",
      });
    }

    // In parallel: a vendor picking four photos should wait for the slowest,
    // not for all four one after another.
    const uploaded = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer, PRODUCT_FOLDER))
    );

    return res.status(201).json({
      success: true,
      message: `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`,
      // Only the URLs. The product schema stores strings, and the form has no
      // use for a publicId it would only have to carry around.
      images: uploaded.map((image) => image.url),
    });
  } catch (error) {
    // uploadImage sets 503 when Cloudinary is unconfigured and 502 when it
    // refuses the upload — both are about the server, not the request.
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
