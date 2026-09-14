import { subscribe } from "../services/newsletterService.js";

export const subscribeController = async (req, res) => {
  try {
    const { email } = req.body;

    await subscribe(email);

    return res.status(200).json({
      success: true,
      message: "You're on the list — look out for our next drop.",
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};
