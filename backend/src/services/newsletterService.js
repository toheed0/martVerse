import Subscriber from "../models/Subscriber.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const subscribe = async (email) => {
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throw createError("Enter a valid email address", 400);
  }

  const normalised = email.toLowerCase().trim();

  // Upsert rather than create: signing up twice is something people do by
  // accident all the time, and it should be a no-op, not an error. It also
  // re-subscribes anyone who had opted out and changed their mind.
  await Subscriber.findOneAndUpdate(
    { email: normalised },
    { $set: { status: "subscribed" }, $setOnInsert: { email: normalised } },
    { upsert: true, new: true }
  );

  return { email: normalised };
};
