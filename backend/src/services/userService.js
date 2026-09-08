import User from "../models/UserModel.js";

// password and refreshTokenHash must never reach the client.
const PUBLIC_FIELDS = "-password -refreshTokenHash -__v";

const STATUSES = ["pending", "active", "rejected", "blocked"];

export const getUsers = async ({ role, status } = {}) => {
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;

  const users = await User.find(filter)
    .select(PUBLIC_FIELDS)
    .sort({ createdAt: -1 });

  return users;
};

export const updateUserStatus = async (userId, status, actingAdminId) => {
  if (!STATUSES.includes(status)) {
    throw new Error(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Without this an admin could block themselves and lock the whole team out
  // of the admin area, with no way back in through the API.
  if (String(userId) === String(actingAdminId)) {
    throw new Error("You cannot change your own account status");
  }

  const update = { status };

  // Losing access should be immediate — drop the stored refresh token so an
  // open session can't quietly mint new access tokens.
  if (status !== "active") {
    update.refreshTokenHash = null;
  }

  // findByIdAndUpdate rather than save(), so we never load the password field
  // just to write one column.
  const user = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  }).select(PUBLIC_FIELDS);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
