import { HTTP_STATUS } from "../constants/httpStatus.js";
import { SERVER_ERROR } from "../constants/messages.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || SERVER_ERROR;

  if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error("Unhandled auth-service error:", err);
  }

  return res.status(statusCode).json({ message });
};
