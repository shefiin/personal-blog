import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign({
      sub: user._id.toString(),  
      email: user.email,
      role: user.role
    },
    process.env.JWT_KEY,
    { expiresIn: "15m" }
  );
};


export const generateRefreshToken = (user) => {
    return jwt.sign({
        sub: user._id.toString(),   
        email: user.email,
        role: user.role
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );
};
