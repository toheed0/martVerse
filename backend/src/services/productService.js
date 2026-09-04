import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/UserModel.js";

export const createProduct = async ({
  vendorId,
  categoryId,
  name,
  description,
  price,
  stock,
  images,
}) => {
  // Check vendor
  const vendor = await User.findOne({
    _id: vendorId,
    role: "vendor",
    status: "active",
  });

  if (!vendor) {
    throw new Error("Active vendor not found");
  }

  // Check category
  const category = await Category.findOne({
    _id: categoryId,
    status: "active",
  });

  if (!category) {
    throw new Error("Active category not found");
  }

  // Create product
  const product = await Product.create({
    vendorId,
    categoryId,
    name,
    description,
    price,
    stock,
    images,
  });

  return product;
};

export const getAllProducts = async ({
  page = 1,
  limit = 10,
  search,
  categoryId,
  minPrice,
  maxPrice,
}) => {
  const skip = (page - 1) * limit;

  const filter = {
    status: "active",
  };

  // Search by product name
  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  // Category filter
  if (categoryId) {
    filter.categoryId = categoryId;
  }

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = maxPrice;
    }
  }

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name slug")
      .populate("vendorId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    },
  };
};

export const getProductById = async (productId) => {
  const product = await Product.findOne({
    _id: productId,
    status: "active",
  })
    .populate("categoryId", "name slug")
    .populate("vendorId", "name");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const updateProduct = async (
  productId,
  vendorId,
  {
    categoryId,
    name,
    description,
    price,
    stock,
    images,
    status,
  }
) => {
  const product = await Product.findOne({
    _id: productId,
    vendorId,
  });

  if (!product) {
    throw new Error(
      "Product not found or you are not authorized to update it"
    );
  }

  // If category is being changed, make sure it is active
  if (categoryId !== undefined) {
    const category = await Category.findOne({
      _id: categoryId,
      status: "active",
    });

    if (!category) {
      throw new Error("Active category not found");
    }

    product.categoryId = categoryId;
  }

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (stock !== undefined) product.stock = stock;
  if (images !== undefined) product.images = images;
  if (status !== undefined) product.status = status;

  await product.save();

  return product;
};


export const deleteProduct = async (productId, vendorId) => {
  const product = await Product.findOne({
    _id: productId,
    vendorId,
  });

  if (!product) {
    throw new Error(
      "Product not found or you are not authorized to delete it"
    );
  }

  if (product.status === "inactive") {
    throw new Error("Product is already inactive");
  }

  product.status = "inactive";

  await product.save();

  return product;
};