import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// What the client needs to draw a cart row. Kept in one place so every response
// has the same shape — an unpopulated cart leaves the UI holding ids and
// nothing to render.
const CART_PRODUCT_FIELDS = "name price stock images status";

const withProducts = async (cart) => {
  await cart.populate("items.productId", CART_PRODUCT_FIELDS);

  // A hard-deleted product populates to null, and because cart items are
  // declared with { _id: false } the original id is gone from the response
  // too — leaving a row the buyer can neither price nor remove. Drop those
  // lines here. Nothing is saved, so this only shapes the response.
  cart.items = cart.items.filter((item) => item.productId);

  return cart;
};

export const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findOne({
    _id: productId,
    status: "active",
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [
        {
          productId,
          quantity,
        },
      ],
    });

    return withProducts(cart);
  }

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new Error("Insufficient stock");
    }

    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      productId,
      quantity,
    });
  }

  await cart.save();

  return withProducts(cart);
};

export const getCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  // No cart row yet is not an error — a signed-in buyer who has never added
  // anything simply has an empty one.
  if (!cart) {
    return {
      userId,
      items: [],
    };
  }

  return withProducts(cart);
};

export const updateCartItem = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const item = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (!item) {
    throw new Error("Product not found in cart");
  }

  const product = await Product.findOne({
    _id: productId,
    status: "active",
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (quantity > product.stock) {
    throw new Error("Insufficient stock");
  }

  item.quantity = quantity;

  await cart.save();

  return withProducts(cart);
};

export const removeCartItem = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const itemExists = cart.items.some(
    (item) => item.productId.toString() === productId
  );

  if (!itemExists) {
    throw new Error("Product not found in cart");
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  await cart.save();

  return withProducts(cart);
};

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  // Clearing a cart that was never created is a no-op, not a failure — the
  // caller asked for an empty cart and that is what they get.
  if (!cart) {
    return {
      userId,
      items: [],
    };
  }

  cart.items = [];

  await cart.save();

  return cart;
};
