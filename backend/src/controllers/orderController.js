import {
  cancelOrder,
  confirmOrderPayment,
  createOrder,
  getMyOrders,
  getOrderById,
  getOrdersForAdmin,
  getVendorOrders,
  updateOrderStatus,
} from "../services/orderService.js";

export const createOrderController = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    // The service returns the payment handle alongside the order — it is the
    // one thing the client cannot derive for itself, and it is null for cash
    // on delivery.
    const { order, clientSecret } = await createOrder(
      req.user._id,
      shippingAddress,
      paymentMethod
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
      clientSecret,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelOrderController = async (req, res) => {
  try {
    const { id } = req.params;

    // The whole user goes to the service, which narrows the query by role — a
    // buyer still reaches only their own order.
    const order = await cancelOrder(id, req.user);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// The browser calls this after Stripe reports the card cleared. Nothing about
// the payment is read from the request body — the service asks Stripe itself.
export const confirmOrderPaymentController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await confirmOrderPayment(id, req.user);

    return res.status(200).json({
      success: true,
      message: "Payment confirmed",
      order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyOrdersController = async (req, res) => {
  try {
    const orders = await getMyOrders(req.user._id);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await getOrderById(id, req.user);

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdminOrdersController = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const { status, userId } = req.query;

    const result = await getOrdersForAdmin({
      page,
      limit,
      status,
      userId,
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

export const getVendorOrdersController = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const { status } = req.query;

    const result = await getVendorOrders(req.user._id, {
      page,
      limit,
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

export const updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const order = await updateOrderStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Order marked as ${status}`,
      order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
