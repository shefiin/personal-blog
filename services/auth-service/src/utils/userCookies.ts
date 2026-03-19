const isProd = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
};

export const setUserAuthCookies = (res, accessToken: string, refreshToken: string) => {
  res.cookie("uf_user_at", accessToken, {
    ...baseCookieOptions,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("uf_user_rt", refreshToken, {
    ...baseCookieOptions,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const setUserRefreshCookie = (res, refreshToken: string) => {
  res.cookie("uf_user_rt", refreshToken, {
    ...baseCookieOptions,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearUserAuthCookies = (res) => {
  res.clearCookie("uf_user_at", { ...baseCookieOptions, path: "/" });
  res.clearCookie("uf_user_rt", { ...baseCookieOptions, path: "/" });
};

export const clearUserRefreshCookie = (res) => {
  res.clearCookie("uf_user_rt", { ...baseCookieOptions, path: "/" });
};
