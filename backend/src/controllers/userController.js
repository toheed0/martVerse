import { getUsers, updateUserStatus } from "../services/userService.js";

export const getUsersController = async (req, res) => {
  try {
    const { role, status } = req.query;

    const users = await getUsers({ role, status });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await updateUserStatus(id, status, req.user._id);

    return res.status(200).json({
      success: true,
      message: `Account marked as ${status}`,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
