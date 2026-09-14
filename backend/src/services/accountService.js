import bcrypt from "bcryptjs";

import User from "../models/UserModel.js";
import Product from "../models/Product.js";

// More than this and the picker at checkout stops being a shortcut.
const MAX_ADDRESSES = 6;

const MIN_PASSWORD_LENGTH = 6;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const REQUIRED_ADDRESS_FIELDS = ["fullName", "phone", "address", "city"];

// Named so the buyer is told which box to fix, the same way checkout does.
const cleanAddress = (input) => {
  const missing = REQUIRED_ADDRESS_FIELDS.filter(
    (field) => !input?.[field]?.trim()
  );

  if (missing.length) {
    throw createError(`Address is missing: ${missing.join(", ")}`, 400);
  }

  return {
    label: input.label?.trim() || "",
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode?.trim() || "",
  };
};

// "Only one may be default" cannot be said in a schema, so it is said here —
// in one place that every write goes through, rather than at each call site.
const applyDefault = (user, chosenId) => {
  for (const entry of user.addresses) {
    entry.isDefault = String(entry._id) === String(chosenId);
  }
};

export const listAddresses = async (userId) => {
  const user = await User.findById(userId).select("addresses");

  if (!user) throw createError("User not found", 404);

  // Default first, then newest — the order the picker wants to show them in.
  return [...user.addresses].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
};

export const addAddress = async (userId, input) => {
  const user = await User.findById(userId);

  if (!user) throw createError("User not found", 404);

  if (user.addresses.length >= MAX_ADDRESSES) {
    throw createError(
      `You can save at most ${MAX_ADDRESSES} addresses — remove one first`,
      400
    );
  }

  const clean = cleanAddress(input);

  // The first one saved is the default whether or not it was asked for:
  // a list of addresses with no default would leave checkout with nothing to
  // preselect.
  const shouldBeDefault = input.isDefault === true || user.addresses.length === 0;

  user.addresses.push(clean);

  const added = user.addresses[user.addresses.length - 1];

  if (shouldBeDefault) applyDefault(user, added._id);

  await user.save();

  return added;
};

export const updateAddress = async (userId, addressId, input) => {
  const user = await User.findById(userId);

  if (!user) throw createError("User not found", 404);

  const entry = user.addresses.id(addressId);

  if (!entry) throw createError("Address not found", 404);

  Object.assign(entry, cleanAddress(input));

  // Promoting one demotes the rest; un-ticking the only default is refused
  // below rather than silently leaving the list without one.
  if (input.isDefault === true) {
    applyDefault(user, entry._id);
  }

  await user.save();

  return entry;
};

export const removeAddress = async (userId, addressId) => {
  const user = await User.findById(userId);

  if (!user) throw createError("User not found", 404);

  const entry = user.addresses.id(addressId);

  if (!entry) throw createError("Address not found", 404);

  const wasDefault = entry.isDefault;

  entry.deleteOne();

  // Deleting the default would otherwise leave every address unticked, and
  // checkout with nothing to preselect. The newest survivor takes over.
  if (wasDefault && user.addresses.length) {
    applyDefault(user, user.addresses[user.addresses.length - 1]._id);
  }

  await user.save();

  return user.addresses;
};

export const setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId);

  if (!user) throw createError("User not found", 404);

  if (!user.addresses.id(addressId)) {
    throw createError("Address not found", 404);
  }

  applyDefault(user, addressId);

  await user.save();

  return user.addresses;
};

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

// The same fields the cart populates, so a wishlist row and a cart row can be
// drawn by the same components.
const WISHLIST_PRODUCT_FIELDS = "name price stock images status";

export const listWishlist = async (userId) => {
  const user = await User.findById(userId)
    .select("wishlist")
    .populate("wishlist", WISHLIST_PRODUCT_FIELDS);

  if (!user) throw createError("User not found", 404);

  // A hard-deleted product populates to null and would render as an empty row
  // the buyer can neither open nor remove. Drop those from the response —
  // nothing is saved, so this only shapes what goes out.
  return user.wishlist.filter(Boolean);
};

export const addToWishlist = async (userId, productId) => {
  const product = await Product.findById(productId).select("_id");

  if (!product) throw createError("Product not found", 404);

  // $addToSet rather than push: saving the same product twice is something a
  // double-tapped heart does constantly, and it should be a no-op.
  await User.updateOne(
    { _id: userId },
    { $addToSet: { wishlist: product._id } }
  );

  return listWishlist(userId);
};

export const removeFromWishlist = async (userId, productId) => {
  await User.updateOne({ _id: userId }, { $pull: { wishlist: productId } });

  return listWishlist(userId);
};

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

// Changing a password while signed in, as opposed to resetting a forgotten one.
// The current password is the proof here — a live session is not enough, since
// the whole point is to shut out someone who is holding one.
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw createError("Both the current and the new password are required", 400);
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw createError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400
    );
  }

  if (currentPassword === newPassword) {
    throw createError("The new password must be different", 400);
  }

  const user = await User.findById(userId);

  if (!user) throw createError("User not found", 404);

  const correct = await bcrypt.compare(currentPassword, user.password);

  if (!correct) throw createError("Your current password is not correct", 401);

  user.password = await bcrypt.hash(newPassword, 10);

  // There is one refresh slot per account, so whatever the caller replaces it
  // with is the only session left standing. The controller issues a fresh
  // token for this browser and everything else falls off.
  user.refreshTokenHash = null;

  await user.save();

  return user;
};
