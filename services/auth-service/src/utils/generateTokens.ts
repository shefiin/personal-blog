import jwt from "jsonwebtoken";

const ensureStringId = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

export const createAccessToken = (user) => {
  return jwt.sign(
    {
      sub:   ensureStringId(user._id),
      email: user.email,
      role:  user.role,
    },
    process.env.JWT_KEY,
    { expiresIn: "15m" }
  );
};

export const createRefreshToken = (user) => {
  return jwt.sign(
    {
      sub:   ensureStringId(user._id),
      email: user.email,
      role:  user.role,
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};